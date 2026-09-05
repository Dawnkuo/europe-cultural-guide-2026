"""Generate local, uncropped review sheets; never modify the site images."""
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "work/media-review"


def audit():
    OUT.mkdir(parents=True, exist_ok=True)
    paths = sorted(p for p in (ROOT / "public").rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif"})
    records = []
    for index, path in enumerate(paths):
        image = cv2.imread(str(path))
        record = {"id":index+1, "path":"/"+str(path.relative_to(ROOT / "public")), "sha256":hashlib.sha256(path.read_bytes()).hexdigest()}
        if image is None:
            records.append({**record,"error":"cannot-decode"})
            continue
        h,w = image.shape[:2]
        scale = min(1, 640 / max(h,w))
        gray = cv2.cvtColor(cv2.resize(image,(round(w*scale),round(h*scale))),cv2.COLOR_BGR2GRAY)
        dct = cv2.dct(cv2.resize(gray,(32,32)).astype(np.float32))[:8,:8]
        record.update({"width":w,"height":h,"bytes":path.stat().st_size,
                       "sharpness":round(cv2.Laplacian(gray,cv2.CV_64F).var(),2),
                       "phash":"".join("1" if value>np.median(dct[1:]) else "0" for value in dct.flat)})
        records.append(record)
    (OUT / "inventory.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n")
    for start in range(0,len(records),20):
        sheet = np.full((4*236,5*270,3),245,np.uint8)
        for offset,record in enumerate(records[start:start+20]):
            x,y = offset%5*270,offset//5*236
            image = cv2.imread(str(ROOT / "public" / record["path"].lstrip("/")))
            if image is not None:
                h,w=image.shape[:2]
                scale=min(250/w,188/h)
                thumb=cv2.resize(image,(round(w*scale),round(h*scale)),interpolation=cv2.INTER_AREA)
                th,tw=thumb.shape[:2]
                sheet[y+8+(188-th)//2:y+8+(188-th)//2+th,x+(270-tw)//2:x+(270-tw)//2+tw]=thumb
            name=Path(record["path"]).name
            cv2.putText(sheet,f'{record["id"]:03d} {name[:31]}',(x+6,y+210),cv2.FONT_HERSHEY_SIMPLEX,.39,(20,20,20),1,cv2.LINE_AA)
            cv2.putText(sheet,f'{record.get("width",0)}x{record.get("height",0)} sharp {record.get("sharpness",0)}',(x+6,y+228),cv2.FONT_HERSHEY_SIMPLEX,.37,(60,60,60),1,cv2.LINE_AA)
        cv2.imwrite(str(OUT/f'sheet-{start//20+1:02d}.jpg'),sheet,[cv2.IMWRITE_JPEG_QUALITY,94])
    by_hash={}
    for record in records:
        by_hash.setdefault(record["sha256"],[]).append(record["id"])
    print(json.dumps({"images":len(records),"broken":[r["path"] for r in records if "error" in r],
        "small":[{k:r[k] for k in ("id","path","width","height")} for r in records if r.get("width",0)<640],
        "duplicates":[ids for ids in by_hash.values() if len(ids)>1]},ensure_ascii=False,indent=2))


if __name__=="__main__":
    audit()
