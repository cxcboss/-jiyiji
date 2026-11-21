"""Print the paper and pixel atlases from the cartoon master render.
Run python3 art/print_editions.py path/to/cartoon.png
"""
from pathlib import Path
import sys
from PIL import Image,ImageFilter
import numpy as np
from scipy.ndimage import gaussian_filter, distance_transform_edt
src=Image.open(sys.argv[1]).convert('RGBA')
dest=Path(__file__).resolve().parents[1]/'web/assets'
S=src.width//5; out={key:Image.new('RGBA',src.size) for key in ('pixel','paper')};rng=np.random.default_rng(555)
yy,xx=np.mgrid[:S,:S]; n=xx/S-.5; v=yy/S-.5
for k in range(20):
    px=k%5*S;py=k//5*S
    tile=src.crop((px,py,px+S,py+S))
    # Reduced-resolution sprites have a selective shadow, Bayer dithering and a fixed color ramp.
    small=tile.resize((40,40),Image.Resampling.LANCZOS); data=np.array(small).astype(float)
    a=data[:,:,3]/255; colors=data[:,:,:3]
    bayer=np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]])/16-.5
    colors=np.clip(np.floor(colors/27+np.tile(bayer,(10,10))[:,:,None]*.32+.5)*27,0,255)
    previous=np.roll(a,1,axis=0);following=np.roll(a,-1,axis=0)
    colors[(a>.55)&(previous<.4)] = colors[(a>.55)&(previous<.4)]*.72+np.array([70,72,65])
    colors[(a>.55)&(following<.4)]*=.78
    pic=Image.fromarray(np.dstack((np.clip(colors,0,255),np.where(a>.49,255,0))).astype('uint8'))
    out['pixel'].paste(pic.resize((S,S),Image.Resampling.NEAREST),(px,py))
    # A warm offset card edge, two paper planes, sparse fibers and printed dots.
    im=np.array(tile).astype(float);mask=im[:,:,3]/255;col=im[:,:,:3]
    norm=np.maximum(col.max(axis=2,keepdims=True),1)
    hue=col/norm;warm=np.array([1.035,.982,.91])
    plane=np.where(v>.38*n+.032,.80,np.where(v<-.64*n-.055,1.12,1.0))
    col=col*warm*plane[:,:,None]*.94+np.array([12,10,7])
    fx=xx%6;fy=(yy+(xx//6%2)*3)%6
    dot=(np.hypot(fx-3,fy-3)<1.54)&(v>.78*n+.018)
    col[dot]=col[dot]*.66+np.array([12,7,5])
    # A folded corner and an offset second sheet catch light along the cheek and edge.
    fold=(n>.086)&(v>-.64*n+.059)&(v<-.64*n+.072)
    col[fold]=col[fold]*.60+np.array([93,76,49])
    pulp=rng.normal(0,2.4,(S,S))+gaussian_filter(rng.normal(0,8.1,(S,S)),2.3)
    col+=pulp[:,:,None];edge=distance_transform_edt(mask>.48)
    rim=(edge>0)&(edge<2.05);col[rim]=col[rim]*.73+np.array([58,51,41])
    specks=rng.random((S,S))>.995;col[specks]=col[specks]*.68+np.array([69,63,52])
    top=Image.fromarray(np.dstack((np.clip(col,0,255),im[:,:,3])).astype('uint8'))
    shadow=Image.new('RGBA',(S,S));edgec=Image.new('RGBA',(S,S),(114,73,67));edgec.putalpha(tile.getchannel('A'))
    shadow.alpha_composite(edgec,(5,7));cream=Image.new('RGBA',(S,S),(225,190,144));cream.putalpha(tile.getchannel('A'));shadow.alpha_composite(cream,(3,4));shadow.alpha_composite(top)
    out['paper'].paste(shadow,(px,py))
for key,atlas in out.items():
    atlas.save(dest/('crew-'+key+'.webp'),quality=94,lossless=key=='pixel',method=6)

