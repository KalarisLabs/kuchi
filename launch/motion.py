import sys, numpy as np
from PIL import Image
import glob
N=len(glob.glob("out/raw2/*.jpg"))
fr=[np.asarray(Image.open(f"out/raw2/{i+1:04d}.jpg").convert("L"),dtype=np.float32) for i in range(N)]
d=np.array([0]+[np.abs(fr[i]-fr[i-1]).mean() for i in range(1,N)])
starts=[int(x) for x in sys.argv[1].split(",")]
names=sys.argv[2].split(",")
def shot(s): return names[max(j for j,x in enumerate(starts) if x<=s)]
run=0
for i,v in enumerate(list(d)+[99]):
    if v<0.15: run+=1
    else:
        if run>=10: s=i-run; print(f"STATIC {s}-{i-1} ({run}f {run/30:.1f}s) in {shot(s)}")
        run=0
print("cuts:")
for k,s in enumerate(starts[1:],1):
    print(f"{names[k-1]:>9} -> {names[k]:<9} cut {d[s]:5.1f}  before {d[s-6:s].mean():.2f}  after {d[s+1:s+7].mean():.2f}")
