"""Bake one transparent 5 × 4 atlas. Usage: blender -b -P art/build_crew.py -- cartoon /tmp/crew.png
Supported materials: cartoon, metal, plush, glass. Eyes and mouths are animated in the web renderer.
"""
import bpy
import bisect
import json
import math
import random
import sys
from pathlib import Path
from mathutils import Vector

style, output = sys.argv[sys.argv.index('--')+1:]
cast_file = Path(__file__).resolve().parents[1] / 'web/js/cast.js'
roster = json.loads(cast_file.read_text().split('globalThis.JellyCast = ')[1].rstrip(';\n '))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = {'cartoon':6, 'metal':23, 'plush':36, 'glass':22}[style]
scene.cycles.use_denoising = style in ('metal','glass','plush')
scene.cycles.max_bounces = 4
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = 1800,1440
scene.render.resolution_percentage = 100
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard' if style == 'cartoon' else 'AgX'
scene.world = bpy.data.worlds.new('Soft room')
scene.world.use_nodes = True
wn = scene.world.node_tree.nodes
env = wn.new('ShaderNodeTexEnvironment')
env.image = bpy.data.images.load(str(Path(bpy.utils.system_resource('DATAFILES'))/'studiolights/world/studio.exr'))
wn.get('Background').inputs['Strength'].default_value = .47 if style=='metal' else .31
scene.world.node_tree.links.new(env.outputs['Color'],wn.get('Background').inputs['Color'])

def rgb(color):
    color=color.lstrip('#')
    return [int(color[i:i+2],16)/255 for i in (0,2,4)]

def rgba(values):
    return (*[(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4) for x in values],1)

materials = {}
def paint(color):
    if color in materials: return materials[color]
    m=bpy.data.materials.new(color);m.use_nodes=True
    nt=m.node_tree; n=nt.nodes; link=nt.links.new; base=rgb(color)
    shader=n.get('Principled BSDF')
    if style=='cartoon':
        n.remove(shader); g=n.new('ShaderNodeNewGeometry'); dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT'
        dot.inputs[1].default_value=Vector((-.39,.61,.69)).normalized();link(g.outputs['Normal'],dot.inputs[0])
        ramp=n.new('ShaderNodeValToRGB'); cr=ramp.color_ramp;cr.interpolation='EASE'
        cr.elements.remove(cr.elements[1])
        stops=[(0, .82,0),(.17,.88,0),(.34,.95,0),(.66,1,0),(.91,1,.035),(.974,1,.075),(.981,1,.47),(1,1,.56)]
        for i,(at,k,w) in enumerate(stops):
            e=cr.elements[0] if i==0 else cr.elements.new(at)
            e.position=at;e.color=rgba([min(1,x*k*(1-w)+w) for x in base])
        link(dot.outputs['Value'],ramp.inputs['Fac']);em=n.new('ShaderNodeEmission')
        link(ramp.outputs['Color'],em.inputs['Color']);link(em.outputs[0],n.get('Material Output').inputs[0])
    else:
        tones=base if style=='metal' else [v*.96+.018 for v in base]
        shader.inputs['Base Color'].default_value=rgba(tones)
        shader.inputs['Metallic'].default_value=.59 if style=='metal' else 0
        shader.inputs['Roughness'].default_value=.32 if style=='metal' else .91
        shader.inputs['Coat Weight'].default_value=.18 if style=='metal' else 0
        shader.inputs['Coat Roughness'].default_value=.25
        if style=='glass':
            dye=[x*.83+add for x,add in zip(base,(.11,.15,.16))]
            shader.inputs['Base Color'].default_value=rgba(dye)
            shader.inputs['Metallic'].default_value=.16;shader.inputs['Roughness'].default_value=.135
            shader.inputs['Transmission Weight'].default_value=.31;shader.inputs['IOR'].default_value=1.40
            shader.inputs['Coat Weight'].default_value=.54;shader.inputs['Coat Roughness'].default_value=.095
            fres=n.new('ShaderNodeFresnel');fres.inputs['IOR'].default_value=1.48
            ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.63,.63,.63,1);ramp.color_ramp.elements[1].color=(1,1,1,1)
            link(fres.outputs[0],ramp.inputs[0]);blank=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader')
            link(ramp.outputs[0],mix.inputs[0]);link(blank.outputs[0],mix.inputs[1]);link(shader.outputs[0],mix.inputs[2]);link(mix.outputs[0],n.get('Material Output').inputs[0])
        if style=='plush':
            shader.inputs['Sheen Weight'].default_value=.29
            shader.inputs['Sheen Roughness'].default_value=.79
            noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=79;noise.inputs['Detail'].default_value=1.7
            bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.24;bump.inputs['Distance'].default_value=.016
            link(noise.outputs['Fac'],bump.inputs['Height']);link(bump.outputs[0],shader.inputs['Normal'])
    materials[color]=m
    return m

offset=Vector((0,0,0)); fur_parts=[]
def finish(obj,color,fuzz=True,smooth=True):
    obj.data.materials.append(paint(color))
    if smooth and hasattr(obj.data,'polygons'):
        for face in obj.data.polygons: face.use_smooth=True
    if fuzz and style=='plush': fur_parts.append((obj,color))
    return obj

def oval(x,y,z,w,h,depth,col,angle=0,fuzz=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36,ring_count=22,location=offset+Vector((x,y,z)))
    obj=bpy.context.object;obj.scale=(w,h,depth);obj.rotation_euler.z=angle
    return finish(obj,col,fuzz)

def wire(points,rad,col):
    cur=bpy.data.curves.new('Piping','CURVE');cur.dimensions='3D';cur.resolution_u=10;cur.bevel_depth=rad;cur.bevel_resolution=3
    s=cur.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,v in zip(s.bezier_points,points):
        p.co=offset+Vector(v);p.handle_left_type=p.handle_right_type='AUTO'
    cur.use_fill_caps=True;obj=bpy.data.objects.new('Piping',cur);scene.collection.objects.link(obj);return finish(obj,col,False)

def shape(points,z,depth,col,bevel=.05,angle=0):
    # Extruded, softly rounded angular silhouettes for ears, hats and visors.
    front=[(x,y,z) for x,y in points];back=[(x,y,z-depth) for x,y in points]; n=len(points)
    mesh=bpy.data.meshes.new('Cut felt');mesh.from_pydata(front+back,[],[tuple(range(n)),tuple(range(n*2-1,n-1,-1))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]);mesh.update()
    obj=bpy.data.objects.new('Layer',mesh);scene.collection.objects.link(obj);obj.location=offset;obj.rotation_euler.z=angle
    import bmesh
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    mod=obj.modifiers.new('Rolled edges','BEVEL');mod.width=bevel;mod.segments=4
    obj.modifiers.new('Face normals','WEIGHTED_NORMAL')
    return finish(obj,col,True,False)

def box(x,y,z,w,h,depth,r,col):
    steps=7;pts=[]
    for cx,cy,a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,math.pi/2),(-w/2+r,-h/2+r,math.pi),(w/2-r,-h/2+r,1.5*math.pi)]:
        for j in range(steps):
            theta=a+j/ (steps-1)*math.pi/2
            pts.append((x+cx+r*math.cos(theta),y+cy+r*math.sin(theta)))
    return shape(pts,z,depth,col,min(.07,depth*.27,r*.45))

def petal(x,y,z,r):
    for j in range(5):
        a=j*math.tau/5
        oval(x+math.cos(a)*r*.60,y+math.sin(a)*r*.60,z,r*.47,r*.46,.046,'#f58ac6',a,False)
    oval(x,y,z+.045,r*.37,r*.37,.045,'#ffd857',fuzz=False)

def draw_head(g,col):
    gold='#ffc649';dark='#344047'; silver='#ccd7d7'
    if g in ('terminal','bot'):
        box(0,0,.36,1.91,1.56,.69,.31,silver if g=='terminal' else gold)
        box(0,.025,.42,1.69,1.26,.15,.24,'#20343b')
        if g=='terminal':
            box(0,.81,.16,1.57,.12,.20,.05,'#49b995')
            for i,hue in enumerate(['#4cc675','#fe755c','#ffd743','#6786db']):
                shape([(-.64+i*.32,.82),(-.32+i*.32,.82),(-.12+i*.08,1.17),(-.3+i*.17,1.23)],.115,.18,hue,.035)
            wire([(0,1.13,.0),(0,1.36,.0)],.034,dark)
            oval(0,1.34,.12,.38,.062,.065,'#ef8067',.13)
        else:
            for s in (-1,1):
                wire([(s*.60,.64,0),(s*.68,1.03,0)],.041,'#536668')
                oval(s*.7,1.09,0,.16,.16,.14,gold)
            box(0,-.69,.475,.23,.064,.045,.028,'#6ddce8')
        return
    if g=='oak':
        oval(0,-.12,.0,.76,.77,.62,'#a4663f')
        for x,y,r in [(-.58,.47,.52),(.56,.48,.50),(-.21,.70,.58),(.22,.65,.60)]:
            oval(x,y,.05,r,r*.76,r*.64,col)
        for x,y,r in [(-.49,.48,.31),(.14,.58,.26),(.52,.48,.24)]:
            oval(x,y,.28,r,r*.55,r*.41,'#8bd05a')
        return
    if g=='sun':
        for j in range(10):
            a=j*math.tau/10
            points=[(math.cos(a+v)*r,math.sin(a+v)*r*.96) for v,r in [(-.27,.78),(.03,1.25),(.27,.78)]]
            shape(points,-.02,.18,'#fca040',.045)
        oval(0,0,.11,.87,.86,.55,col);return
    oval(0,0,0,1,.84,.73,col)
    if g=='phones':
        wire([(-.95,-.05,.02),(-.87,.46,.07),(-.52,.85,.04),(0,.99,-.02),(.52,.85,.04),(.87,.46,.07),(.95,-.05,.02)],.088,'#613e3c')
        wire([(-.86,.43,.10),(-.42,.88,.11),(0,.94,.08),(.43,.88,.11),(.86,.43,.10)],.047,'#ffe3ad')
        for s in (-1,1):
            wire([(s*.57,.65,-.15),(s*.71,1.08,-.13)],.046,'#ebad69')
            oval(s*.75,1.13,-.12,.172,.172,.12,'#ffab43')
            oval(s*.947,-.02,.18,.19,.34,.22,'#b56140')
            oval(s*.995,-.02,.32,.148,.276,.117,'#ffd18d')
            oval(s*1.025,-.01,.396,.071,.184,.047,'#e99b5c')
        shape([(-.62,.49),(-.26,.72),(-.07,.61),(.04,.73),(.27,.48),(.17,.53),(.06,.48),(-.17,.59),(-.22,.54)],.49,.10,'#ed7d36',.02)
    elif g=='bear':
        for s in (-1,1):
            oval(s*.69,.66,-.07,.30,.30,.21,col)
            oval(s*.71,.69,.09,.175,.173,.071,'#b9f6ec')
        wire([(.03,.69,.05),(.035,.91,.02),(.18,1.05,.0)],.049,col)
    elif g in ('spikes','flame'):
        count=5
        for j in range(count):
            a=(.34+j*(math.pi-.68)/(count-1))
            dx,dy=math.cos(a),math.sin(a);lean=.15 if g=='spikes' else .03
            points=[(.67*dx-.22*dy,.57*dy+.22*dx),(1.18*dx+lean,1.18*dy+(.10 if j==2 else 0)),(.68*dx+.24*dy,.56*dy-.24*dx)]
            shape(points,-.02,.27,col,.054)
        if g=='spikes':shape([(-.51,.55),(-.13,.74),(-.18,.61),(.18,.70),(-.11,.45),(-.07,.57)],.54,.08,'#90ca42',.021)
        else:
            for s in (-1,1):
                shape([(s*.76,.20),(s*1.08,.54),(s*.89,-.055)],-.02,.20,col,.043)
                oval(s*.72,.27,.39,.075,.090,.052,'#f96b5d')
    elif g in ('ivory','ash','horn'):
        inner={'ivory':'#ddc6ce','ash':'#565964','horn':'#8842bc'}[g]
        for s in (-1,1):
            if g=='horn':
                shape([(s*.39,.55),(s*.73,1.29),(s*.86,.45)],.04,.34,col,.072)
                shape([(s*.78,.01),(s*1.14,.38),(s*1.13,-.31)],.04,.20,inner,.05)
            else:
                shape([(s*.34,.54),(s*.99,1.08),(s*.87,.14)],.07,.27,col,.052)
                shape([(s*.57,.62),(s*.87,.89),(s*.81,.40)],.11,.10,inner,.035)
                if g=='ivory':
                    for y in (-.12,-.37):shape([(s*.78,y+.12),(s*1.15,y-.08),(s*.78,y-.13)],-.03,.13,col,.032)
    elif g=='rabbit':
        for s in (-1,1):
            oval(s*.53,.86,-.09,.214,.55,.15,col,s*-.23)
            oval(s*.55,.93,.024,.107,.37,.061,'#ec6aac',s*-.23)
            oval(s*.17,.71,.34,.208,.155,.092,'#df487e',s*.27)
        oval(0,.71,.425,.092,.098,.068,'#ff9bc1')
    elif g=='aerial':
        for s in (-1,1):
            wire([(s*.5,.59,0),(s*.72,1.08,-.06)],.041,'#e2a72e')
            oval(s*.73,1.13,-.04,.18,.18,.13,gold)
            shape([(s*.84,.12),(s*1.18,-.05),(s*.85,-.22)],-.02,.18,col,.035)
        shape([(-.42,.57),(-.04,.93),(-.10,.71),(.34,.91),(.14,.57)],.32,.20,col,.041)
    elif g=='disc':
        oval(0,.64,.02,1.12,.22,.49,'#a2b4bd',-.035)
        oval(0,.70,.08,1.10,.19,.42,'#e0e7e5',-.035)
        wire([(0,.72,.01),(-.025,1.12,0),(-.13,1.16,0)],.050,'#748993')
        oval(-.13,1.16,.02,.10,.052,.06,'#c9d8d9')
    elif g=='flower':
        leaf='#419c5c';highlight='#7ce477'
        for s in (-1,1):
            for j in range(3):
                xx=s*(.58+j*.145); yy=.49-j*.27; zz=.55-j*.07
                oval(xx,yy,zz,.14,.40,.12,leaf if j%2==0 else '#6bd778',s*-.29)
                wire([(xx-s*.04,yy+.17,zz+.091),(xx+s*.06,yy-.19,zz+.097)],.023,highlight)
        oval(-.25,.58,.52,.13,.28,.09,'#67cf70',-.88)
        wire([(.25,.66,-.06),(.35,.99,-.04),(.23,1.24,0)],.058,leaf)
        petal(-.56,.66,.49,.23);petal(.64,.53,.46,.17)
    elif g=='visor':
        box(0,0,.688,1.83,1.04,.32,.27,'#c18b3f')
        box(0,.044,.744,1.69,.94,.25,.237,'#ffe083')
        box(0,.056,.795,1.49,.76,.14,.173,'#66dce2')
        for s in (-1,1):oval(s*.95,.00,.23,.11,.20,.12,'#e1a447')
    elif g=='hood':
        oval(0,-.015,.33,.85,.69,.421,'#505dcc')
        wire([(-.86,-.20,.17),(-.77,.38,.29),(-.43,.70,.29),(0,.80,.28),(.43,.70,.29),(.77,.38,.29),(.86,-.20,.17)],.119,'#354497')
    elif g=='bucket':
        shape([(-.58,.48),(-.42,1.23),(.60,1.06),(.70,.38)],.28,.57,'#a4adb0',.088,-.11)
        oval(.12,1.104,.31,.51,.102,.084,'#66757c',-.23)
        wire([(-.56,.51,.38),(0,.43,.47),(.65,.35,.31)],.061,'#c5cdcb')
    elif g=='ranger':
        for s in (-1,1):oval(s*.81,-.14,.09,.13,.42,.13,'#bd915f',s*.15)
        box(0,.73,.09,1.43,.52,.40,.23,'#b48148')
        box(0,.61,.27,1.44,.17,.22,.055,'#826041')
        oval(0,.57,.29,1.10,.123,.38,'#ca9755')
    elif g=='hat':
        box(-.05,.85,.09,1.27,.62,.48,.16,'#383a42')
        box(-.05,.63,.26,1.27,.17,.24,.045,'#595c68')
        oval(-.016,.56,.28,1.08,.15,.42,'#42444e',-.055)

for i,(_,gear,col,_,_) in enumerate(roster):
    offset=Vector(((i%5-2)*3.4,(1.5-i//5)*3.4,0));draw_head(gear,col)
    if style=='glass':
        for x,y,rad in ((-.67,.27,.066),(-.74,.11,.034),(.70,-.31,.065),(.60,-.39,.033)):
            oval(x,y,.52,rad,rad,rad*.52,'#d4f3ed',fuzz=False)

def groom():
    # Real tapered fibers follow the normals, combed outwards over each patch.
    rng=random.Random(254);bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get(); batches={}
    for obj,color in fur_parts:
        ev=obj.evaluated_get(deps);mesh=ev.to_mesh();mesh.calc_loop_triangles();mat=ev.matrix_world
        normal_matrix=mat.to_3x3().inverted().transposed()
        verts=[mat@v.co for v in mesh.vertices];normals=[(normal_matrix@v.normal).normalized() for v in mesh.vertices]
        triangles=[];ends=[];area=0
        for tri in mesh.loop_triangles:
            a,b,c=tri.vertices;cross=(verts[b]-verts[a]).cross(verts[c]-verts[a])
            if cross.z < -cross.length*.42: continue
            area+=cross.length*.5;ends.append(area);triangles.append((a,b,c))
        strands=batches.setdefault(color,[])
        for _ in range(int(area*590)):
            a,b,c=triangles[bisect.bisect(ends,rng.random()*area)]
            u=math.sqrt(rng.random());v=rng.random();weights=(1-u,u*(1-v),u*v)
            root=verts[a]*weights[0]+verts[b]*weights[1]+verts[c]*weights[2]
            norm=(normals[a]*weights[0]+normals[b]*weights[1]+normals[c]*weights[2]).normalized()
            comb=Vector((.19+.18*math.sin(root.y*4),-.31+.16*math.cos(root.x*5),.08))
            length=rng.uniform(.028,.078)
            tip=root+(norm+comb+Vector((rng.uniform(-.28,.28),rng.uniform(-.23,.23),0)))*length
            mid=root+(norm*.62+comb*.34)*length
            strands.append((root-norm*.009,mid,tip))
        ev.to_mesh_clear()
    for color,group in batches.items():
        if not group:continue
        hair=bpy.data.curves.new('Combed nap','CURVE');hair.dimensions='3D';hair.bevel_depth=.009;hair.bevel_resolution=0;hair.resolution_u=1
        for line in group:
            spl=hair.splines.new('POLY');spl.points.add(2)
            for p,pos,r in zip(spl.points,line,(.94,.68,.11)):
                p.co=(*pos,1);p.radius=r
        obj=bpy.data.objects.new('Short pile',hair);scene.collection.objects.link(obj);obj.data.materials.append(paint(color))
if style=='plush':groom()

def area(name,pos,size,depth,color,power):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='RECTANGLE';data.size=size;data.size_y=depth
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=(-Vector(pos)).to_track_quat('-Z','Y').to_euler()
area('Broad key',(-15,19,23),19,12,(1,.94,.86),12100)
area('Rim',(20,3,16),8,22,(.78,.88,1),6900)
area('Bounce',(-7,-19,13),17,7,(1,.86,.75),3500)
bpy.ops.object.camera_add(location=(0,0,32));cam=bpy.context.object;cam.rotation_euler=(0,0,0);cam.data.type='ORTHO';cam.data.ortho_scale=17
scene.camera=cam;scene.render.filepath=output;bpy.ops.render.render(write_still=True)
