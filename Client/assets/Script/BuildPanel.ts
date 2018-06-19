import { DataMgr, IJ } from "./DataMgr";
import BuildingButton from "./BuildingButton";
import ArkUI from "./ArkUI";
import CurrencyFormatter from "./Utils/CurrencyFormatter";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuildPanel extends cc.Component {
    static Instance: BuildPanel;
    onLoad() {
        BuildPanel.Instance = this;
        this.node.active = false;
    }

    @property(cc.Node)
    buttonContainer: cc.Node = null;
    @property(cc.Node)
    buttonTemplate: cc.Node = null;
    @property(cc.Label)
    lblExpandCost: cc.Label = null;

    start() {
        DataMgr.BuildingConfig.forEach(info => {
            if (info.id == '_upgradeRate') return;
            let buildingBtnNode = cc.instantiate(this.buttonTemplate);
            buildingBtnNode.parent = this.buttonContainer;
            let buildingBtn = buildingBtnNode.getComponent(BuildingButton);
            buildingBtn.setAndRefresh(info);
            buildingBtnNode.active = true;
        });
        this.buttonTemplate.active = false;
    }

    onEnable() {
        this.lblExpandCost.string = CurrencyFormatter.formatNAS(DataMgr.getExpandCost(DataMgr.myData.expandCnt, 1)) + 'NAS';
    }

    refresh() {

    }

    static Show() {
        BuildPanel.Instance.node.active = true;
    }
    static Hide() {
        BuildPanel.Instance.node.active = false;
    }

    onBtnExpandClick() {
        ArkUI.Instance.currentHoldingBlueprint = 'expand';
        ArkUI.Instance.currentBlueprintIJ = IJ.ZERO;
        this.close();
    }

    close() {
        this.node.active = false;
    }
}