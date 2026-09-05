"""Restore every reviewed service symbol masked out of Pedrera linework."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "sources/floorplans/venues/la-pedrera.json"
SYMBOLS = {
    "ground": ["西侧电梯", "中央楼梯", "东侧电梯", "语音导览", "卫生间标志", "男女卫生间", "育婴设施", "无障碍设施", "衣帽寄存", "庭院楼梯", "商店", "信息咨询"],
    "apartment": ["西侧电梯", "中央楼梯", "东侧电梯", "卫生间标志", "男女卫生间", "育婴设施", "无障碍设施", "商店"],
    "attic": ["西侧电梯", "中央楼梯", "东侧电梯", "西侧螺旋楼梯", "东侧螺旋楼梯"],
    "roof": ["西侧螺旋楼梯", "东侧螺旋楼梯"],
}


def main():
    config = json.loads(PATH.read_text())
    source = ROOT / "sources/floorplans" / config["sourceFiles"][0]["file"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != "c43a31cbd4880d001a88a06bc979730d79979f9152006846bbbd796f218befe0":
        raise ValueError("Reviewed visitor source changed")
    inventory = []
    for floor in config["floors"]:
        level = floor["id"].removeprefix("historic-visitor-")
        masks = [m for m in floor["rasterLayers"][0]["excludeRects"] if "badge" in m["reason"]]
        if len(masks) != len(SYMBOLS[level]):
            raise ValueError(f"Source symbol inventory changed: {level}")
        floor["servicePlaces"] = []
        for label, mask in zip(SYMBOLS[level], masks, strict=True):
            x0, y0, x1, y1 = mask["rect"]
            floor["servicePlaces"].append({
                "label": label, "name": label, "kind": "service", "at": [(x0 + x1) / 2, (y0 + y1) / 2],
                "evidence": f"Restored semantic symbol at the original historic brochure badge position: {mask['reason']}. Badge is omitted only from physical linework; its location is not an inferred service-room footprint or present-day access promise.",
                "precision": "historic-brochure-printed-service-symbol",
            })
            inventory.append({"floorId": floor["id"], "label": label, "sourceBadgeBounds": mask["rect"]})
    ground = config["floors"][0]
    flower = next(p for p in ground["places"] if p["label"] == "花卉庭院")
    flower["at"] = [330, 260]
    flower["evidence"] = "Brochure entrance b explicitly identifies Passeig de Gracia. The Flower Courtyard is the western courtyard by its curved stair and ramp, not the purple shop area at the former erroneous anchor500,535. Current official practical-information page confirms Flower=Passeig de Gracia and Butterfly=Provenca; this point locates the visible courtyard zone without inventing a closed room boundary."
    ground["sourceSpaces"][0]["scope"] = "floor"
    notes = "旧折页的服务图标保留在原标注位置，不代表现行服务设施；庭院为位置标注，不用整层楼面代替庭院边界。"
    config["limitations"] = list(dict.fromkeys([*config["limitations"], notes]))
    PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    report = {"sourceSha256": config["sourceFiles"][0]["sha256"], "reviewedSymbolCount": len(inventory),
              "symbols": inventory, "courtyardCorrection": {"oldAt": [500, 535], "newAt": flower["at"],
              "reason": "Previous anchor lay in the purple shop footprint, not the Passeig courtyard.",
              "officialSemanticUrl": "https://www.lapedrera.com/en/practical-information/"},
              "newVerticalLinks": [], "reason": "The symbol inventory alone does not establish which modern public stair/lift connects every level."}
    (ROOT / "sources/floorplans/rebuild-reports/pedrera-services.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print("Restored printed services:", len(inventory))


if __name__ == "__main__":
    main()
