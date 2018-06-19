import { BuildingInfo, BuildingData, DataMgr } from "./DataMgr";
import ArkUI from "./ArkUI";
import { IJ } from "../DataMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Building extends cc.Component {

    ij: IJ;
    info: BuildingInfo;
    data: BuildingData;

    @property(cc.Label)
    lblName: cc.Label = null;

    onClick() {
        ArkUI.Instance.selectBuilding(this);
    }

    setInfo(info: BuildingInfo, data: BuildingData) {
        this.info = info;
        this.data = data;
        if (this.lblName) this.lblName.string = info.Name;
        this.node.setContentSize(info.Length * 100, info.Width * 100);
    }
}
