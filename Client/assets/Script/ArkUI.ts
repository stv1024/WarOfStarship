import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import WorldUI from "./WorldUI";
import { DataMgr, BuildingInfo, IJ, BuildingData } from "./DataMgr";
import BuildPanel from "./BuildPanel";
import Building from "./City/Building";
import TechPanel from "./TechPanel";
import DialogPanel from "./DialogPanel";
import BuildingInfoPanel from "./UI/BuildingInfoPanel";
import CurrencyFormatter from "./Utils/CurrencyFormatter";
import BlockchainMgr from "./BlockchainMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ArkUI extends BaseUI {
    static Instance: ArkUI;
    onLoad() {
        ArkUI.Instance = this;
        this.node.active = false;

        let self = this;
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_START, function (event) {
            self.pressingZoomSlider = true;
        });
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_END, function (event) {
            self.pressingZoomSlider = false;
        });
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            self.pressingZoomSlider = false;
        });
        this.panPad.on(cc.Node.EventType.TOUCH_MOVE, this.onPanPadTouchMove, this);
        this.panPad.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.panPad.on(cc.Node.EventType.TOUCH_END, this.deselectBuilding, this);

        // this.cells = [];
        // for (let i = -200; i <= -1; i++) {
        //     this.cells[i] = [];
        //     for (let j = -100; j < 100; j++) {
        //         this.cells[i][j] = new Cell();
        //     }
        // }

        this.blueprint.on(cc.Node.EventType.TOUCH_MOVE, this.dragBlueprint.bind(this));

        this.floorTemplate.active = false;
        this.producerTemplate.active = false;
        this.collectorTemplate.active = false;
        this.warehouseTemplate.active = false;
    }

    @property(cc.Node)
    arkMap: cc.Node = null;
    @property(cc.Node)
    ark: cc.Node = null;

    @property(cc.Node)
    cargoLabelContainer: cc.Node = null;
    @property(cc.Node)
    cargoLabelTemplate: cc.Node = null;
    cargoLabels = {};

    @property(cc.Node)
    panPad: cc.Node = null;
    @property(cc.Slider)
    sldZoom: cc.Slider = null;
    pressingZoomSlider = false;
    zoomScale: number = 1;

    start() {
        DataMgr.CargoConfig.forEach(cargoInfo => {
            let labelNode = cc.instantiate(this.cargoLabelTemplate);
            labelNode.parent = this.cargoLabelContainer;
            let label = labelNode.getComponent(cc.Label);
            label.string = cargoInfo.Name;
            this.cargoLabels[cargoInfo.id] = label;
        });
        this.cargoLabelTemplate.active = false;
    }

    onEnable() {
        this.refreshBuildingData();
        this.refreshZoom();

        let myData = DataMgr.myData;
        // for (let i = -Math.floor(myData.arkSize / 2); i < myData.arkSize / 2; i++) {
        //     for (let j = -Math.floor(myData.arkSize / 2); j < myData.arkSize / 2; j++) {
        //         let cell = this.cells[i][j];
        //         cell.isLand = true;
        //         cell.building = null;
        //     }
        // }

        // this.buildingContainer.destroyAllChildren();
        // let workers = 0;
        // DataMgr.myBuildingData.forEach(data => {
        //     let info = DataMgr.BuildingConfig.find(i => i.id == data.id);
        //     console.log('precreatebuilding', data);
        //     this.createBuilding(info, data);
        //     workers += data.workers;
        // });

        // DataMgr.idleWorkers = myData.population - workers;

        // this.deselectBuilding();
    }

    refreshZoom() {
        this.arkMap.scale = this.zoomScale;
    }

    update(dt: number) {

        for (let i = 0; i < DataMgr.CargoConfig.length; i++) {
            const cargoInfo = DataMgr.CargoConfig[i];
            let data = DataMgr.myData.cargoData.find(d => d.id == cargoInfo.id);
            let estimateRate: number = DataMgr.outputRates[cargoInfo.id];
            if (!estimateRate) estimateRate = 0;
            let str = cargoInfo.Name + '   ' + Math.floor(data ? data.amount : 0).toFixed() + '(' + (estimateRate > 0 ? '+' : '') + estimateRate.toFixed() + ')';
            this.cargoLabels[cargoInfo.id].string = str;
        }

        let prog = this.sldZoom.progress;
        if (!this.pressingZoomSlider) {
            if (prog > 0.5) {
                prog -= 5 * dt;
                if (prog < 0.5) prog = 0.5;
                this.sldZoom.progress = prog;
            } else if (prog < 0.5) {
                prog += 5 * dt;
                if (prog > 0.5) prog = 0.5;
                this.sldZoom.progress = prog;
            }
        }
        if (prog != 0.5) {
            let oldZoomScale = this.zoomScale;
            this.zoomScale *= Math.pow(1.5, (prog - 0.5) * 2 * 5 * dt);
            this.clampZoom();
            let deltaZoom = this.zoomScale / oldZoomScale;
            this.arkMap.position = this.arkMap.position.mul(deltaZoom);
            this.refreshZoom();
        }

        if (this.currentHoldingBlueprint) {
            this.blueprint.active = true;
            this.blueprint.position = new cc.Vec2(this.currentBlueprintIJ.i * 100 - 50, this.currentBlueprintIJ.j * 100 - 50);
            this.blueprint.setContentSize(100, 100);
            this.grpBuild.active = true;
            let ableToBuild = true;
            let key = this.currentBlueprintIJ.i + ',' + this.currentBlueprintIJ.j;
            if (DataMgr.myData.buildingMap[key]) {
                ableToBuild = false;
            } else if (!DataMgr.myData.expandMap[key]) {
                ableToBuild = false;
            }
            this.btnConfirmBuild.interactable = ableToBuild;
        } else {
            this.blueprint.active = false;
            this.grpBuild.active = false;
        }
        if (this.selectedBuilding) {
            this.grpBuildingInfo.active = true;
        } else {
            this.grpBuildingInfo.active = false;
        }

    }

    refreshBuildingData() {
        const buildingMap = DataMgr.myData.buildingMap;
        for (let key in buildingMap) {
            buildingMap[key].tmpDirty = true;
        }
        this.buildingContainer.children.forEach(bdgNode => {
            let bdg = bdgNode.getComponent(Building);
            const ij = bdg.ij;
            const key = ij.i + ',' + ij.j;
            const bdgOnChain = buildingMap[key];
            if (!bdgOnChain) {
                bdgNode.destroy();
                return;
            }
            if (bdg.info.id != bdgOnChain.id) {
                bdgNode.destroy();
                return;
            }
            bdg.setInfo(bdg.info, bdgOnChain);
            delete bdgOnChain.tmpDirty;
        });
        for (let key in buildingMap) {
            if (buildingMap[key].tmpDirty) {
                const data = buildingMap[key];
                let info = DataMgr.getBuildingInfo(data.id);
                let prefabName = info['Prefab'];
                let buildingNode = cc.instantiate(this[prefabName + 'Template']);
                buildingNode.parent = this.buildingContainer;
                let building = buildingNode.getComponent(Building);
                building.setInfo(info, data);
                buildingNode.position = new cc.Vec2(data.i * 100, data.j * 100);
                buildingNode.active = true;
                delete buildingMap[key].tmpDirty;
            }
        }
    }

    onGotoWorldClick() {
        this.deselectBuilding();
        CvsMain.EnterUI(WorldUI);
    }
    onBuildBtnClick() {
        this.deselectBuilding();
        BuildPanel.Show();
        TechPanel.Hide();
    }
    onCommanderClick() {

    }

    onCenterBtnClick() {
        this.arkMap.position = new cc.Vec2(0, 0);
    }

    onPanPadTouchMove(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        // if (this.currentHoldingBlueprint){
        //     this.dragBlueprint(event);
        // }else{
        this.arkMap.position = this.arkMap.position.add(new cc.Vec2(delta.x, delta.y));
    }
    onMouseWheel(event: cc.Event.EventMouse) {
        let delta = event.getScrollY();
        let oldZoomScale = this.zoomScale;
        this.zoomScale *= Math.pow(1.5, (delta / 120)); //delta每次±120
        this.clampZoom();
        let deltaZoom = this.zoomScale / oldZoomScale;
        this.arkMap.position = this.arkMap.position.mul(deltaZoom);
        this.refreshZoom();
    }
    onZoomSliderChange(slider: cc.Slider) {
        // console.log('sld', slider.progress);
    }
    clampZoom() {
        if (this.zoomScale > 3) this.zoomScale = 3;
        if (this.zoomScale < 0.3) this.zoomScale = 0.3;
    }

    //Build
    @property(cc.Node)
    floorTemplate: cc.Node = null;
    @property(cc.Node)
    floorContainer: cc.Node = null;
    @property(cc.Node)
    collectorTemplate: cc.Node = null;
    @property(cc.Node)
    producerTemplate: cc.Node = null;
    @property(cc.Node)
    warehouseTemplate: cc.Node = null;
    @property(cc.Node)
    buildingContainer: cc.Node = null;
    @property(cc.Node)
    blueprint: cc.Node = null;
    @property(cc.Sprite)
    blueprintIndicator: cc.Sprite = null;
    currentHoldingBlueprint: BuildingInfo = null;
    currentBlueprintIJ: IJ;
    enterBuildMode(buildingInfo: BuildingInfo) {
        this.currentHoldingBlueprint = buildingInfo;
        this.currentBlueprintIJ = IJ.ZERO;
    }
    dragBlueprint(event: cc.Event.EventTouch) {
        let now = event.getLocation();
        let touchPosInArkMap = this.arkMap.convertToNodeSpaceAR(now);
        // this.blueprint.position = touchPosInArkMap;
        this.currentBlueprintIJ.i = Math.round(touchPosInArkMap.x / 100);
        this.currentBlueprintIJ.j = Math.round(touchPosInArkMap.y / 100);
    }
    @property(cc.Node)
    grpBuild: cc.Node = null;
    @property(cc.Button)
    btnConfirmBuild: cc.Button = null;
    onBtnConfirmBuildClick() {
        //检查重叠
        let ableToBuild = true;
        for (let i = 0; i < this.currentHoldingBlueprint.Length; i++) {
            for (let j = 0; j < this.currentHoldingBlueprint.Width; j++) {
                let cell = this.cells[this.currentBlueprintIJ.i + i][this.currentBlueprintIJ.j + j];
                if (cell.building) ableToBuild = false;
                if (!cell.isLand) ableToBuild = false;
            }
        }
        if (!ableToBuild) return;
        //确定建造
        //检查建筑材料
        let buildMats = [];
        for (let i = 0; i < 4; i++) {
            let mat = this.currentHoldingBlueprint['BuildMat' + i];
            if (mat && mat.length > 0) {
                let count = this.currentHoldingBlueprint['BuildMat' + i + 'Count'];
                buildMats.push([mat, count]);
            }
        }
        let enough = true;
        buildMats.forEach(mat => {
            let cargoData = DataMgr.myCargoData.find(data => data.id == mat[0]);
            if (cargoData.amount < mat[1]) {
                enough = false;
            }
        })
        if (enough) {
            buildMats.forEach(mat => {
                let cargoData = DataMgr.myCargoData.find(data => data.id == mat[0]);
                cargoData.amount -= mat[1];
            })

            let data = new BuildingData();
            data.id = this.currentHoldingBlueprint.id;
            data.ij = this.currentBlueprintIJ.clone();
            data.workers = 0;
            DataMgr.myBuildingData.push(data);
            this.createBuilding(this.currentHoldingBlueprint, data);

            if (this.currentHoldingBlueprint.id == 'road00001') {
                this.currentBlueprintIJ.j += 1;
            } else {
                this.currentHoldingBlueprint = null;
            }
        }
    }
    onBtnCancelBuildClick() {
        this.currentHoldingBlueprint = null;
    }
    createBuilding(blueprint: BuildingInfo, data: BuildingData) {
        let prefabName = blueprint['prefab'];
        let buildingNode = cc.instantiate(this[prefabName + 'Template']);
        buildingNode.parent = this.buildingContainer;
        let building = buildingNode.getComponent(Building);
        building.setInfo(blueprint, data);
        buildingNode.position = new cc.Vec2(data.ij.i * 100 - 50, data.ij.j * 100 - 50);
        buildingNode.active = true;
        for (let i = 0; i < blueprint.Length; i++) {
            for (let j = 0; j < blueprint.Width; j++) {
                let cell = this.cells[data.ij.i + i][data.ij.j + j];
                cell.building = building;
            }
        }
    }

    //建筑信息
    selectedBuilding: Building = null;
    @property(cc.Node)
    grpBuildingInfo: cc.Node = null;
    selectBuilding(building: Building) {
        console.log('选中建筑', building);
        this.selectedBuilding = building;
    }
    deselectBuilding() {
        this.selectedBuilding = null;
    }
    onDemolishBtnClick() {
        let self = ArkUI.Instance;
        if (this.selectedBuilding) {
            DialogPanel.PopupWith2Buttons('确定拆除建筑吗',
                self.selectedBuilding.info.Name
                + '\n建筑材料不予返还',
                '取消', null,
                '拆除', () => {
                    self.demolishBuilding(self.selectedBuilding);
                    self.deselectBuilding();
                });
        }
    }
    demolishBuilding(building: Building) {
        if (!building) return;
        //拆除建筑
        console.log('拆除建筑');
        let index = DataMgr.myBuildingData.findIndex(data => data == building.data);
        if (index >= 0) {
            //施放工人
            let workers = building.data.workers;
            DataMgr.myBuildingData.splice(index, 1);
            DataMgr.idleWorkers += workers;
            //施放土地
            const info = DataMgr.BuildingConfig.find(i => i.id == building.data.id);
            console.log('info.Length', info.Length);
            for (let i = 0; i < info.Length; i++) {
                for (let j = 0; j < info.Width; j++) {
                    console.log('cells', building.data.ij.i + i, building.data.ij.j + j);
                    this.cells[building.data.ij.i + i][building.data.ij.j + j].building = null;
                }
            }
            building.node.destroy();
        }
    }
    onBuildingInfoBtnClick() {
        if (this.selectedBuilding) {
            BuildingInfoPanel.Show(this.selectedBuilding.info);
            this.deselectBuilding();
        }
    }
}

class Cell {
    isLand = false;
    building: Building = null;
}