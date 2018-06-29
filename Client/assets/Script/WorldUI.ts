import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import MainCtrl from "./MainCtrl";
import ArkUI from "./ArkUI";
import { DataMgr } from "./DataMgr";
import BlockchainMgr from "./BlockchainMgr";
import HomeUI from "./HomeUI";
import Island from "./World/Island";
import AttackIslandPanel from "./UI/AttackIslandPanel";
import DialogPanel from "./DialogPanel";
import CurrencyFormatter from "./Utils/CurrencyFormatter";
import SponsorIslandPanel from "./UI/SponsorIslandPanel";
import IslandInfoFrame from "./UI/IslandInfoFrame";
import ToastPanel from "./UI/ToastPanel";
import { SpecialArk } from "./World/SpecialArk";
import ArkInWorld from "./World/ArkInWorld";
import Star from "./World/Star";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WorldUI extends BaseUI {
    static Instance: WorldUI;
    onLoad() {
        WorldUI.Instance = this;
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
        this.panPad.on(cc.Node.EventType.TOUCH_END, this.onPanPadTouchEnd, this);

        // cc.systemEvent.on(cc.SystemEvent.EventType.)

        this.initIslandInfoFrames();
    }

    @property(cc.Node)
    islandContainer: cc.Node = null;

    @property(cc.Node)
    arkContainer: cc.Node = null;
    @property(cc.Node)
    arkTemplate: cc.Node = null;

    @property(cc.Node)
    starContainer: cc.Node = null;
    @property(cc.Node)
    starTemplate: cc.Node = null;

    @property(cc.Node)
    worldMap: cc.Node = null;
    @property(cc.Node)
    earth: cc.Node = null;

    @property(cc.Node)
    grpSelectObject: cc.Node = null;
    @property(cc.Node)
    grpSelectSpeArk: cc.Node = null;
    @property(cc.Node)
    selectFrame: cc.Node = null;
    @property(cc.Button)
    btnObjectInfo: cc.Button = null;
    @property(cc.Button)
    btnSponsorLink: cc.Button = null;
    @property(cc.Label)
    lblAttackButton: cc.Label = null;
    @property(cc.Button)
    btnCollectIsland: cc.Button = null;

    @property(cc.Node)
    panPad: cc.Node = null;
    @property(cc.Slider)
    sldZoom: cc.Slider = null;
    pressingZoomSlider = false;
    zoomScale: number = 0.2;
    lastTickZoomScale = null;

    start() {
        //生成一堆恒星
        for (let index = 0; index < DataMgr.allStars.length; index++) {
            let starInfo = DataMgr.allStars[index];
            let starNode = cc.instantiate(this.starTemplate);
            starNode.parent = this.starContainer;
            starNode.position = new cc.Vec2(starInfo.x, starInfo.y);
            let star = starNode.getComponent(Star);
            star.setAndRefresh(index, starInfo);
            starNode.active = true;
            starNode.name = index.toFixed();

            star.btn.on(cc.Node.EventType.TOUCH_MOVE, this.onPanPadTouchMove, this);
            star.btn.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }
        this.starTemplate.active = false;
    }
    onEnable() {
        this.editSailDestinationMode = false;
        this.selectedObjectNode = null;

        if (!DataMgr.myData) return;

        try {
            this.refreshData();
            this.refreshZoom();
        } catch (e) {
            console.error(e);
        }
    }
    onBtnBackClick() {
        CvsMain.EnterUI(HomeUI);
    }

    refreshData() {
        //myData
        let neededCount = Object.keys(DataMgr.othersData).length + 1;
        for (let i = this.arkContainer.childrenCount; i < neededCount; i++) {
            let arkNode = cc.instantiate(this.arkTemplate);
            arkNode.parent = this.arkContainer;
        }
        let needToDestroys: cc.Node[] = [];
        for (let i = neededCount; i < this.arkContainer.childrenCount; i++) {
            needToDestroys.push(this.arkContainer.children[i]);
        }
        needToDestroys.forEach(c => c.destroy());

        this.refreshMyCity();

        let i = 0;
        for (let address in DataMgr.othersData) {
            const data = DataMgr.othersData[address];
            this.arkContainer.children[i + 1].getComponent(ArkInWorld).setAndRefresh(data, this.zoomScale);
            i++;
        }
    }

    refreshMyCity() {
        if (DataMgr.myData) {
            let arkIW = this.arkContainer.children[0].getComponent(ArkInWorld);
            arkIW.setAndRefresh(DataMgr.myData, this.zoomScale);
        }
        else {
            this.arkContainer.children[0].active = false;
        }
    }

    refreshZoom() {
        // let size = 12000 * this.zoomScale;
        this.earth.scale = this.zoomScale;
        // this.arkContainer.children.forEach(c => {
        //     c.getComponent(ArkInWorld).refreshZoom(this.zoomScale);
        // })
        if (this.editSailDestinationMode && this.newDestination) {
            this.sailDestinationIndicator.position = this.newDestination.mul(this.zoomScale);
        }
    }

    update(dt: number) {
        if (DataMgr.changed || MainCtrl.Ticks % 100 == 0) {
            this.refreshData();
            DataMgr.changed = false;
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
            this.worldMap.position = this.worldMap.position.mul(deltaZoom);
            this.refreshZoom();
        }

        if (this.lastTickZoomScale != this.zoomScale) {
            this.lastTickZoomScale = this.zoomScale;
            this.starContainer.children.forEach(c => c.getComponent(Star).refreshZoom(this.zoomScale));
        }

        //选中对象模式
        if (this.selectedObjectNode) {
            this.selectFrame.active = true;
            this.selectFrame.position = this.selectedObjectNode.position;
            this.selectFrame.setContentSize(this.selectedObjectNode.width * 2, this.selectedObjectNode.height * 2);
            let arkIW = this.selectedObjectNode.getComponent(ArkInWorld);
            let star = this.selectedObjectNode.getComponent(Star);
            let speArk = this.selectedObjectNode.getComponent(SpecialArk);
            let island = this.selectedObjectNode.getComponent(Island);
            if (star) {
                this.grpSelectSpeArk.active = false;
                this.grpSelectObject.active = true;
                if (star.data) {
                    if (star.data.occupant && star.data.occupant == DataMgr.myData.address) {
                        this.lblAttackButton.string = '追加\n驻军';
                        this.btnCollectIsland.node.active = true;
                        this.btnCollectIsland.getComponentInChildren(cc.Label).string = '收取';
                    } else {
                        this.lblAttackButton.string = '攻占';
                        this.btnCollectIsland.node.active = false;
                    }
                } else {
                    this.lblAttackButton.string = '攻占';
                    this.btnCollectIsland.node.active = false;
                }
            } else if (arkIW) {
                this.grpSelectSpeArk.active = false;
                this.grpSelectObject.active = false;
            } else if (island) {
                this.btnSponsorLink.getComponentInChildren(cc.Label).string =
                    island.data.sponsorName ? island.data.sponsorName : '无赞助商';
                if (island.data.occupant && island.data.occupant == DataMgr.myData.address) {
                    this.lblAttackButton.string = '追加\n驻军';
                    const t0 = island.data.lastMineTime;
                    const t1 = Number(new Date());
                    const t = (t1 - t0) / (1000 * 3600);//h
                    const r = island.data.miningRate;
                    const m = island.data.money * (1 - Math.exp(-r * t)) / 1e18;
                    this.btnCollectIsland.node.active = true;
                    this.btnCollectIsland.getComponentInChildren(cc.Label).string = '收取\n' + CurrencyFormatter.formatNAS(m) + 'NAS';
                } else {
                    this.lblAttackButton.string = '攻占';
                    this.btnCollectIsland.node.active = false;
                }
                this.grpSelectSpeArk.active = false;
                this.grpSelectObject.active = true;
            } else if (speArk) {
                this.grpSelectObject.active = false;
                this.grpSelectSpeArk.active = true;
            }
        } else {
            this.grpSelectSpeArk.active = false;
            this.selectFrame.active = false;
            this.grpSelectObject.active = false;
        }

        //选择目的地模式
        if (this.editSailDestinationMode) {
            this.grpSail.active = true;
            this.sailDestinationIndicator.active = this.newDestination != null;
            if (this.newDestination) {
                let pos = DataMgr.getUserCurrentLocation(DataMgr.myData);
                let distance = this.newDestination.sub(pos).mag();
                let time = distance / DataMgr.shipSpeed;
                let energy = distance * (5 + DataMgr.myData.expandCnt) * DataMgr.energyCostPerLyExpand;
                let str = `${distance.toFixed()}ly\n${time.toFixed()}min\n${energy.toFixed()}反物质`;
                this.lblDestinationInfo.string = str;
            }
        } else {
            this.grpSail.active = false;
            this.sailDestinationIndicator.active = false;
        }
    }

    onGotoArkClick() {
        if (DataMgr.myData) {
            CvsMain.EnterUI(ArkUI);
        } else {
            ToastPanel.Toast('观察模式无法进入星舰界面');
        }
    }

    onCenterBtnClick() {
        let data = DataMgr.myData;
        let rawPos = DataMgr.getUserCurrentLocation(data);
        rawPos.mulSelf(this.zoomScale);
        this.worldMap.position = rawPos.neg();
    }

    onPanPadTouchMove(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        this.worldMap.position = this.worldMap.position.add(new cc.Vec2(delta.x, delta.y));
    }
    onPanPadTouchEnd(event: cc.Event.EventTouch) {
        if (this.editSailDestinationMode) {
            let curLoc = event.getLocation();
            let displacement = new cc.Vec2(curLoc.x, curLoc.y).sub(event.getStartLocation());
            if (displacement.mag() < 20) {
                let touchPos = this.worldMap.convertTouchToNodeSpaceAR(event.touch);
                this.newDestination = touchPos.mul(1 / this.zoomScale);
                this.sailDestinationIndicator.position = this.newDestination.mul(this.zoomScale);
            }
        }
        if (this.selectedObjectNode) {
            let curLoc = event.getLocation();
            let displacement = new cc.Vec2(curLoc.x, curLoc.y).sub(event.getStartLocation());
            if (displacement.mag() < 20) {
                this.cancelSelectObject();
            }
        }
    }
    onMouseWheel(event: cc.Event.EventMouse) {
        let delta = event.getScrollY();
        let oldZoomScale = this.zoomScale;
        this.zoomScale *= Math.pow(1.5, (delta / 120)); //delta每次±120
        this.clampZoom();
        let deltaZoom = this.zoomScale / oldZoomScale;
        this.worldMap.position = this.worldMap.position.mul(deltaZoom);
        this.refreshZoom();
    }
    onZoomSliderChange(slider: cc.Slider) {
        // console.log('sld', slider.progress);
    }
    clampZoom() {
        if (this.zoomScale > 10) this.zoomScale = 10;
        if (this.zoomScale < 0.01) this.zoomScale = 0.01;
    }

    //选中
    @property(cc.Label)
    lblAsideSelectFrame: cc.Label = null;
    selectedObjectNode: cc.Node;
    selectObject(node: cc.Node) {
        if (this.editSailDestinationMode) {
            this.newDestination = node.position.mul(1 / this.zoomScale);
            this.sailDestinationIndicator.position = this.newDestination.mul(this.zoomScale);
            return;
        }
        this.selectedObjectNode = node;
    }
    selectSpecialArk(arkNode: cc.Node) {
        if (this.editSailDestinationMode) return;
        this.selectedObjectNode = arkNode;
    }
    selectIsland(islandNode: cc.Node) {
        if (this.editSailDestinationMode) return;
        this.selectedObjectNode = islandNode;
    }
    cancelSelectObject() {
        this.selectedObjectNode = null;
    }
    onSelectObjectInfoClick() {
        let speArk = this.selectedObjectNode.getComponent(SpecialArk);
        if (speArk) {
            let pos = DataMgr.getUserCurrentLocation(DataMgr.myData);
            let dist = pos.sub(speArk.location).mag();
            speArk.showInfo(dist);
        }
    }
    onBtnInfoClick() {
        if (!this.selectedObjectNode) return;
        if (this.selectedObjectNode.getComponent(Star)) {
            this.onBtnAttackStarClick();
        } else if (this.selectedObjectNode.getComponent(ArkInWorld)) {

        } else if (this.selectedObjectNode.getComponent(Island)) {
            this.onBtnAttackIslandClick();
        }
    }
    onBtnAttackStarClick() {
        const star = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Star) : null;
        if (!star) return;
        AttackIslandPanel.Instance.node.active = true;
        AttackIslandPanel.Instance.setAndRefresh(star, star.info);
    }
    onBtnAttackIslandClick() {
        const island = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Island) : null;
        if (!island) return;
        AttackIslandPanel.Instance.node.active = true;
        AttackIslandPanel.Instance.setAndRefresh(island);
    }
    onBtnCollectIslandClick() { //收获
        const island = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Island) : null;
        if (island && island.data.occupant == DataMgr.myData.address) {
            BlockchainMgr.Instance.collectIslandMoney(island.data.id);
        }
        const star = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Star) : null;
        if (star && star.data.occupant == DataMgr.myData.address) {
            BlockchainMgr.Instance.callFunction('collectStar', [star.index], 0,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在收集',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
        }
    }
    onBtnSetDestinationClick() {
        if (!this.selectedObjectNode) return;
        this.editSailDestinationMode = true;
        let touchPos = this.selectedObjectNode.position;
        this.newDestination = touchPos.mul(1 / this.zoomScale);
        this.sailDestinationIndicator.position = this.newDestination.mul(this.zoomScale);

        let info = this.selectedObjectNode.getComponent(Star).info;
        console.log(info.x, info.y, this.newDestination, this.zoomScale);

        this.selectedObjectNode = null;
    }

    //航行
    editSailDestinationMode = false;
    newDestination: cc.Vec2;
    @property(cc.Node)
    grpSail: cc.Node = null;
    @property(cc.Node)
    sailDestinationIndicator: cc.Node = null;
    @property(cc.Label)
    lblDestinationInfo: cc.Label = null;
    @property(cc.Node)
    btnCancelSail: cc.Node = null;
    @property(cc.Node)
    btnConfirmSail: cc.Node = null;

    onBtnSailClick() {
        this.selectedObjectNode = null;
        this.editSailDestinationMode = true;
        this.newDestination = null;
    }
    onCancelSailClick() {
        this.editSailDestinationMode = false;
        this.newDestination = null;
    }
    onConfirmMoveClick() {
        if (!this.newDestination) {
            ToastPanel.Toast('请先点击地图空白位置，选择目的地，再点√');
            return;
        }

        //能量
        let user = DataMgr.myData;
        let curLocation = DataMgr.getUserCurrentLocation(user);
        let energyCost = this.newDestination.sub(curLocation).mag() * (user.expandCnt + 5) * DataMgr.energyCostPerLyExpand;
        if (DataMgr.getUserCurrentCargoData(user)['energy'] < energyCost) {
            ToastPanel.Toast("反物质燃料不足");
            return;
        }

        console.log('ConfirmMove', this.newDestination);
        BlockchainMgr.Instance.move(this.newDestination.x, this.newDestination.y, null);
    }



    //岛屿初始化
    @property(cc.Node)
    islandInfoFrameTemplate: cc.Node = null;
    initIslandInfoFrames() {
        this.islandContainer.children.forEach(islandNode => {
            let frm = cc.instantiate(this.islandInfoFrameTemplate);
            frm.parent = islandNode;
            frm.position = this.islandInfoFrameTemplate.position;
            islandNode.getComponent(Island).infoFrame = frm.getComponent(IslandInfoFrame);
            frm.active = true;
        });
        this.islandInfoFrameTemplate.active = false;
    }
}
