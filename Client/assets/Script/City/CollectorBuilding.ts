import { BuildingInfo, BuildingData, DataMgr } from "../DataMgr";
import Building from "./Building";
import MainCtrl from "../MainCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CollectorBuilding extends Building {

    @property(cc.Label)
    lblOutput: cc.Label = null;
    @property(cc.Node)
    nodeGear: cc.Node = null;

    abundance = 0;

    update(dt: number) {
        if (MainCtrl.Ticks % 200 == 0) this.refresh();
        this.nodeGear.rotation += 360 * this.abundance * dt;
    }

    refresh() {
        let info = this.info;
        const user = DataMgr.myData;
        const curTime = Number(new Date());
        const outid = info['Out0'];
        const outRate = DataMgr.getBuildingInfoItemWithLv(this.info.id, 'Out0Rate', this.data.lv);

        //starInfo
        this.abundance = 0;
        if (user.collectingStarIndex) {
            let star = DataMgr.getStarInfo(user.collectingStarIndex);
            let collectingHours = (curTime - user.lastCalcTime) / 3600000;
            switch (outid) {
                case 'iron':
                    this.abundance = star.ironAbundance;
                    break;
                case 'energy':
                    this.abundance = star.energyAbundance;
                    break;
            }
        }

        let cargoName = DataMgr.getCargoInfo(outid).Name;
        this.lblOutput.string = ` ${(this.abundance * outRate).toPrecision(3)}${cargoName}/h`;
    }
}
