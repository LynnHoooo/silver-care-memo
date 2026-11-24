"""Render organic, sequential growth. GIFs play once and hold their mature frame."""
from PIL import Image, ImageDraw
from pathlib import Path
import math
OUT=Path(__file__).resolve().parents[1]/'assets/growth'
OUT.mkdir(parents=True,exist_ok=True)
S=3
N=84
def ease(x):
    x=max(0,min(1,x)); return x*x*(3-2*x)
def bezier(a,b,c,d,n=24):
    return [tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k] for k in (0,1)) for t in [i/n for i in range(n+1)]]
def render(stage,t):
    im=Image.new('RGBA',(240*S,240*S)); d=ImageDraw.Draw(im)
    def poly(points,fill): d.polygon([(int(x*S),int(y*S)) for x,y in points],fill=fill)
    def line(points,fill,w=1): d.line([(int(x*S),int(y*S)) for x,y in points],fill=fill,width=max(1,int(w*S)),joint='curve')
    def oval(box,fill): d.ellipse(tuple(int(v*S) for v in box),fill=fill)
    progress=stage+ease(t)
    h=22+min(progress,2)*57
    sway=math.sin(t*math.pi*2)*1.2*math.sin(math.pi*t)
    def stem(q): return (120+7*math.sin(q*2.8)+sway*q,207-h*q)
    oval((77,202,168,215),'#e0dfc5')
    for q in [i/65 for i in range(65)]:
        line([stem(q),stem(q+1/65)],'#52754d',4.8-2*q)
    for j in range(6):
        appear=.18+j*.24
        f=ease((progress-appear)/.45)
        if f<=0: continue
        q=.22+j*.115; x,y=stem(q); side=-1 if j%2==0 else 1
        length=(33+j%3*5)*f
        tip=(x+side*length,y-length*(.35+.25*f))
        upper=bezier((x,y),(x+side*length*.25,y-length*.65*f),(tip[0]-side*length*.2,tip[1]-length*.23*f),tip)
        lower=bezier(tip,(tip[0]-side*length*.08,tip[1]+length*.4*f),(x+side*length*.38,y+length*.17*f),(x,y))
        poly(upper+lower,'#72966a' if side<0 else '#4f7e55')
        line([(x,y),tip],'#b1c39a',.65)
        for v in (.35,.55,.75):
            vx=x+(tip[0]-x)*v; vy=y+(tip[1]-y)*v
            line([(vx,vy),(vx+side*length*.07,vy-length*.13*f)],'#a3ba8e',.4)
    x,y=stem(1)
    bud=ease((progress-1.15)/.75)
    bloom=ease((progress-2)/.65)
    fruit=ease((progress-3.25)/.7)
    if bud>0:
        # Petals grow outward from a tight bud, then detach as fruit sets.
        for j in range(10):
            angle=j*math.tau/10
            opening=ease((bloom-j*.018)/.82)
            fall=ease((progress-3-j*.025)/.35)
            radius=3+21*opening
            px=x+math.cos(angle)*radius+fall*math.cos(angle)*15
            py=y-6+math.sin(angle)*radius+fall*36
            if fall<.98:
                rw=(3+6*opening)*bud; rh=(9+5*opening)*bud
                oval((px-rw,py-rh,px+rw,py+rh),'#edbdc0' if j%2 else '#dfa2ac')
                line([(px,py+rh*.5),(px,py-rh*.4)],'#f8d8d5',.5)
        if bloom>0 and fruit<.1:
            r=7*bloom; oval((x-r,y-6-r,x+r,y-6+r),'#d2ab50')
            for j in range(12):
                a=j*2.4; r=math.sqrt(j)*1.45*bloom
                oval((x+math.cos(a)*r-0.6,y-6+math.sin(a)*r-.6,x+math.cos(a)*r+.6,y-6+math.sin(a)*r+.6),'#a88338')
        if fruit>0:
            r=4+17*fruit
            oval((x-r,y-7-r*.5,x+r,y-7+r*1.5),'#bc7656')
            oval((x-r*.65,y-r*.4,x-r*.28,y+r*.5),'#dba27b')
            for k in range(5):
                a=k*math.tau/5
                poly([(x,y-12),(x+math.cos(a)*8,y-12+math.sin(a)*4),(x+math.cos(a+.6)*3,y-12+math.sin(a+.6)*2)],'#65804c')
    return im.resize((240,240),Image.Resampling.LANCZOS)
for stage in range(4):
    frames=[]
    for i in range(N):
        im=render(stage,i/(N-1)); alpha=im.getchannel('A')
        frame=im.convert('RGB').quantize(colors=255)
        frame.paste(255,mask=alpha.point(lambda a:255 if a<100 else 0))
        frame.info['transparency']=255; frames.append(frame)
    # No loop extension: retain final grown state instead of shrinking back.
    frames[0].save(OUT/f'stage-{stage}.gif',save_all=True,append_images=frames[1:],duration=70,transparency=255,disposal=2)
    render(stage,1).save(OUT/f'stage-{stage}.png')
