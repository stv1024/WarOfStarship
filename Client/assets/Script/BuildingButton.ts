import BuildPanel from "./BuildPanel";
import ArkUI from "./ArkUI";
import { BuildingInfo, DataMgr, TechInfo } from "./DataMgr";
import DialogPanel from "./DialogPanel";
import BuildingInfoPanel from "./UI/BuildingInfoPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuildingButton extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;

    @property(cc.Label)
    lblConsumption: cc.Label = null;

    info: BuildingInfo;

    setAndRefresh(info: BuildingInfo) {
        this.info = info;
        this.lblName.string = info.Name;
        let ironCost = info.IronCost;
        this.lblConsumption.string = '原料 ' + ironCost + '铁';
    }

    onClick() {
        BuildingInfoPanel.Show(this.info);
    }

    onBuildClick() {
        //检查建筑材料
        if (!DataMgr.myData.cargoData.iron || DataMgr.myData.cargoData.iron < this.info.IronCost) {
            DialogPanel.PopupWith1Button('建筑材料不足', '', '确定', null);
            return;
        }
        BuildPanel.Hide();
        ArkUI.Instance.enterBuildMode(this.info);
    }
}
