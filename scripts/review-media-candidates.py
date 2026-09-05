"""Contact sheets for candidate review; does not alter production images."""
import json
from pathlib import Path
import cv2
import numpy as np

folder = Path('work/media-review/candidates')
records = [json.loads(p.read_text()) for p in sorted(folder.glob('*.json'))]
for start in range(0, len(records), 5):
    canvas = np.full((5*236, 4*310, 3), 245, np.uint8)
    for row, record in enumerate(records[start:start+5]):
        for col, candidate in enumerate(record['candidates']):
            picture = cv2.imread(str(folder/candidate['local']))
            if picture is None:
                continue
            h,w = picture.shape[:2]
            scale = min(295/w,195/h)
            thumb = cv2.resize(picture, (round(w*scale),round(h*scale)), interpolation=cv2.INTER_AREA)
            th,tw = thumb.shape[:2]
            x,y = col*310+(310-tw)//2,row*236+5
            canvas[y:y+th,x:x+tw]=thumb
            label=candidate['local'].replace('.jpg','')
            cv2.putText(canvas,label,(col*310+5,row*236+219),cv2.FONT_HERSHEY_SIMPLEX,.4,(20,20,20),1,cv2.LINE_AA)
    cv2.imwrite(str(folder/f'review-{start//5+1:02d}.jpg'),canvas,[cv2.IMWRITE_JPEG_QUALITY,95])
print(len(records), 'queries rendered')
