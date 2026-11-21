"""Generate the quiet, stationary backdrops for the illustrated and plush stages."""
from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw
W,H=660,1080
yy,xx=np.mgrid[:H,:W];x=xx/W;y=yy/H
rng=np.random.default_rng(828); dest=Path(__file__).resolve().parents[1]/'web/assets'
def field(top,bottom,light,noise):
    mix=y[:,:,None]**.84; base=np.array(top)*(1-mix)+np.array(bottom)*mix
    glow=np.exp(-((x-.37)**2/.32+(y-.28)**2/.45))[:,:,None]
    grain=rng.normal(0,noise,(H,W,1))
    return np.clip(base+glow*np.array(light)+grain,0,255)
def layer(base,draw_fn):
    over=Image.new('RGBA',base.size); draw_fn(ImageDraw.Draw(over));return Image.alpha_composite(base,over)
def cartoon(d):
    # Screen-printed bass cabinet grille at the edges of a mint rehearsal stage.
    for flip in (False,True):
        cx=W+180 if flip else -180
        for rad in (204,213,238,244,269):
            d.arc((cx-rad,745-rad,cx+rad,745+rad),192 if flip else -67,265 if flip else 67, fill=(75,134,119,24),width=2)
        for i in range(15):
            for j in range(20):
                px=(i*7-48 if not flip else W-i*7+48);py=420+j*9+(i%2)*3
                if 0<px<W and abs(j-9)+i*.8<16:d.ellipse((px,py,px+2,py+2),fill=(80,131,116,28))
    for i,c in enumerate([(115,163,141,25),(161,189,150,50),(127,163,127,28)]):
        points=[(0,H),(0,H-48-i*8),(W*.28,H-60-i*4),(W*.70,H-61+i*4),(W,H-86+i*11),(W,H)]
        d.polygon(points,fill=c)
    for j in range(3):
        d.line(((8+j*5,18),(8+j*5,H-30)),fill=(245,255,230,52-j*13),width=2)
        d.line(((W-8-j*5,20),(W-8-j*5,H-30)),fill=(100,143,132,22-j*5),width=2)
def plush(d):
    for inset in (13,19,W-19,W-13):
        d.line((inset,0,inset,H),fill=(131,87,110,35),width=1)
    for side in (10,W-10):
        for sy in range(12,H-8,15):
            d.line((side-1,sy,side+1,sy+8),fill=(255,236,214,145),width=2)
    # Padded scallops and a knitted binding are just visible behind the pile.
    for i in range(7):
        cx=i*121-20;d.ellipse((cx-80,H-45-(i%2)*19,cx+80,H+60),fill=(190,147,161,38))
    for j in range(2):
        s=3+j*5
        for px in range(8,W-8,15):d.line((px,H-s-7,px+7,H-s-5),fill=(255,237,216,100),width=2)
base=field((167,199,187),(169,197,175),(25,28,21),.95)
im=layer(Image.fromarray(base.astype('uint8')).convert('RGBA'),cartoon)
im.convert('RGB').save(dest/'stage-cartoon.webp',quality=86)
base=field((186,151,158),(203,168,158),(25,24,21),1.04)
weave=(np.cos(xx*math.pi*.77)*.95+np.cos(yy*math.pi*.74)*1.45+np.sin((xx+yy*1.5)*1.3)*.7)[:,:,None]
im=layer(Image.fromarray(np.clip(base+weave,0,255).astype('uint8')).convert('RGBA'),plush)
im.convert('RGB').save(dest/'stage-plush.webp',quality=88)

def tide(d):
    for side in (0,W):
        for i in range(5):
            points=[]
            for py in range(0,H+4,4):
                px=math.sin(py/172+i*.18)*24+math.cos(py/77+i*.27)*6+2+i*9
                points.append((px if not side else W-px,py))
            d.line(points, fill=(153,228,212,36-i*4),width=2)
    for i in range(12):
        cx=(i*97+65)%W;cy=H-22-(i%3)*9
        d.arc((cx-67,cy-9,cx+67,cy+9),179,349,fill=(170,223,211,43),width=2)
def arcade(d):
    for px in range(0,W,28):d.line((px,0,px,H),fill=(144,154,218,12),width=1)
    for py in range(0,H,28):d.line((0,py,W,py),fill=(144,154,218,12),width=1)
    for side in (0,1):
        for j in range(9):
            height=12+(j*31)%57;px=j*19 if side==0 else W-j*19-16
            d.rectangle((px,H-height,px+16,H),fill=(117,118,186,72))
            d.rectangle((px+3,H-height+5,px+5,H-height+8),fill=(191,176,214,76))
        for j in range(9):
            px=3+j%3*6 if side==0 else W-4-j%3*6;py=130+j*62
            d.rectangle((px,py,px+2,py+3),fill=(154,200,201,80))
def paper(d):
    for side in (0,1):
        def point(x,y):return (x if side==0 else W-x,y)
        d.polygon([point(0,0),point(57,0),point(9,400),point(0,440)],fill=(205,138,93,40))
        d.polygon([point(0,260),point(23,320),point(8,H),point(0,H)],fill=(119,158,138,28))
        for j in range(64):
            r=(j*3)%5;px=(j*7)%34;py=412+j*9
            d.ellipse((point(px,py)[0],py,point(px,py)[0]+r,py+r),fill=(150,113,90,32))
    d.polygon([(0,H-49),(W*.3,H-23),(W*.75,H-66),(W,H-42),(W,H),(0,H)],fill=(182,130,113,49))
    d.polygon([(0,H-21),(W*.65,H-32),(W,H-10),(W,H),(0,H)],fill=(202,161,111,90))
for key,cols,fn in [
  ('glass',((49,111,124),(70,139,143),(15,25,19)),tide),
  ('pixel',((49,51,81),(58,58,86),(11,11,20)),arcade),
  ('paper',((218,193,151),(224,195,155),(17,21,24)),paper)]:
    base=field(*cols,1.5 if key=='paper' else .65)
    im=layer(Image.fromarray(base.astype('uint8')).convert('RGBA'),fn)
    im.convert('RGB').save(dest/('stage-'+key+'.webp'),quality=87)
