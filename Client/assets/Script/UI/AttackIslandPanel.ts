import { DataMgr, StarInfo } from "../DataMgr";
import Island from "../World/Island";
import BlockchainMgr from "../BlockchainMgr";
import DialogPanel from "../DialogPanel";
import Star from "../World/Star";
import ToastPanel from "./ToastPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttackIslandPanel extends cc.Component {
    static Instance: AttackIslandPanel;
    onLoad() { AttackIslandPanel.Instance = this; this.node.active = false; }

    @property(cc.Label)
    lblTitle: cc.Label = null;
    @property(cc.Label)
    lblOccupant: cc.Label = null;
    @property(cc.Label)
    lblDefTank: cc.Label = null;
    @property(cc.Label)
    lblDefChopper: cc.Label = null;
    @property(cc.Label)
    lblDefShip: cc.Label = null;

    @property(cc.Label)
    lblIronRate: cc.Label = null;
    @property(cc.Label)
    lblEnergyRate: cc.Label = null;
    @property(cc.Label)
    lblAtkTankMax: cc.Label = null;
    @property(cc.Label)
    lblAtkChopperMax: cc.Label = null;
    @property(cc.Label)
    lblAtkShipMax: cc.Label = null;
    @property(cc.EditBox)
    edtAtkTank: cc.EditBox = null;
    @property(cc.EditBox)
    edtAtkChopper: cc.EditBox = null;
    @property(cc.EditBox)
    edtAtkShip: cc.EditBox = null;
    @property(cc.Slider)
    SldAtkTank: cc.Slider = null;
    @property(cc.Slider)
    SldAtkChopper: cc.Slider = null;
    @property(cc.Slider)
    SldAtkShip: cc.Slider = null;
    @property(cc.Label)
    lblDistance: cc.Label = null;
    @property(cc.Label)
    lblMethane: cc.Label = null;
    @property(cc.Label)
    lblConfirmButton: cc.Label = null;

    tankMax = 0;
    chopperMax = 0;
    shipMax = 0;

    star: Star;
    starInfo: StarInfo;

    setAndRefresh(star: Star, starInfo: StarInfo) {
        this.starInfo = starInfo;
        this.star = star;

        console.log('AIP.setARef', starInfo)
        this.lblTitle.string = '恒星 #' + star.index;

        this.SldAtkTank.progress = 0;
        this.SldAtkChopper.progress = 0;
        this.SldAtkShip.progress = 0;
        this.edtAtkTank.string = '0';
        this.edtAtkChopper.string = '0';
        this.edtAtkShip.string = '0';
        // this.onSliderChange(null, 'Tank');
        // this.onSliderChange(null, 'Chopper');
        // this.onSliderChange(null, 'Ship');
        this.refreshMethaneCost();
    }

    onSliderChange(event, cargoName: string) {
        switch (cargoName) {
            case 'Tank':
                this.edtAtkTank.string = (this.SldAtkTank.progress * this.tankMax).toFixed();
                break;
            case 'Chopper':
                this.edtAtkChopper.string = (this.SldAtkChopper.progress * this.chopperMax).toFixed();
                break;
            case 'Ship':
                this.edtAtkShip.string = (this.SldAtkShip.progress * this.shipMax).toFixed();
                break;
        }
        this.refreshMethaneCost();
    }

    onEditBoxChange(event, cargoName: string) {
        switch (cargoName) {
            case 'Tank':
                let count = parseInt(this.edtAtkTank.string);
                count = Math.max(0, Math.min(this.tankMax, count));
                this.edtAtkTank.string = count.toFixed();
                this.SldAtkTank.progress = count / this.tankMax;
                break;
            case 'Chopper':
                count = parseInt(this.edtAtkChopper.string);
                count = Math.max(0, Math.min(this.chopperMax, count));
                this.edtAtkChopper.string = count.toFixed();
                this.SldAtkChopper.progress = count / this.chopperMax;
                break;
            case 'Ship':
                count = parseInt(this.edtAtkShip.string);
                count = Math.max(0, Math.min(this.shipMax, count));
                this.edtAtkShip.string = count.toFixed();
                this.SldAtkShip.progress = count / this.shipMax;
                break;
        }
        this.refreshMethaneCost();
    }

    update(dt) {
        if (!DataMgr.myData) return;
        let starData = this.star.data;
        let amIOccupant = starData && DataMgr.myData.address == starData.occupant;
        let occupantData = amIOccupant ? DataMgr.myData :
            (starData && starData.occupant ? DataMgr.othersData.find(d => d.address == starData.occupant) : null);
        this.lblOccupant.string = occupantData ? occupantData.nickname :
            (starData ? starData.occupant : '无');
        this.lblConfirmButton.string = amIOccupant ? '追加' : '进攻';
        this.lblDefTank.string = starData ? (starData.army['fighter']) : 0;
        this.lblDefChopper.string = starData ? (starData.army['bomber']) : 0;
        this.lblDefShip.string = starData ? (starData.army['laser']) : 0;
        this.tankMax = Math.floor(DataMgr.myData.cargoData['fighter']);
        this.lblAtkTankMax.string = '/' + this.tankMax.toFixed();
        this.chopperMax = Math.floor(DataMgr.myData.cargoData['bomber']);
        this.lblAtkChopperMax.string = '/' + this.chopperMax.toFixed();
        this.shipMax = Math.floor(DataMgr.myData.cargoData['laser']);
        this.lblAtkShipMax.string = '/' + this.shipMax.toFixed();
        this.lblIronRate.string = (this.starInfo.ironAbundance * this.starInfo.ironAbundance * 1000).toPrecision(4) + '/h';
        this.lblEnergyRate.string = (this.starInfo.energyAbundance * this.starInfo.energyAbundance * 1000).toPrecision(4) + '/h';
    }

    refreshMethaneCost() {
        if (!DataMgr.myData) return;
        const curCargoData = DataMgr.getUserCurrentCargoData(DataMgr.myData);
        const starPos = new cc.Vec2(this.starInfo.x, this.starInfo.y);
        const myPos = DataMgr.getUserCurrentLocation(DataMgr.myData);
        const distance = starPos.sub(myPos).mag();
        const costMethane = DataMgr.getEnergyCostOfAttack(0,
            Math.round(this.SldAtkTank.progress * this.tankMax),
            Math.round(this.SldAtkChopper.progress * this.chopperMax),
            Math.round(this.SldAtkShip.progress * this.shipMax));
        const totalMethane = curCargoData['energy'];
        this.lblDistance.string = distance.toPrecision(4) + 'ly';
        this.lblMethane.string = costMethane.toFixed() + '/' + totalMethane.toFixed();
    }

    onConfirmClick() {
        if (!DataMgr.myData) return;
        console.log('准备攻占资源岛', this.star);
        const curCargoData = DataMgr.getUserCurrentCargoData(DataMgr.myData);

        const starPos = new cc.Vec2(this.starInfo.x, this.starInfo.y);
        const myPos = DataMgr.getUserCurrentLocation(DataMgr.myData);
        const distance = starPos.sub(myPos).mag();

        if (distance > 100) {
            ToastPanel.Toast("距离100ly之内才能进攻");
            return;
        }

        const costMethane = DataMgr.getEnergyCostOfAttack(distance,
            Math.round(this.SldAtkTank.progress * this.tankMax),
            Math.round(this.SldAtkChopper.progress * this.chopperMax),
            Math.round(this.SldAtkShip.progress * this.shipMax));
        const energy = curCargoData['energy'];
        if (costMethane <= energy) {
            const tank = Math.round(this.SldAtkTank.progress * this.tankMax);
            const chopper = Math.round(this.SldAtkChopper.progress * this.chopperMax);
            const ship = Math.round(this.SldAtkShip.progress * this.shipMax);
            BlockchainMgr.Instance.callFunction('attackStar',
                [this.star.index, { fighter: tank, bomber: chopper, laser: ship }], 0,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在递交作战计划',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
        } else {
            ToastPanel.Toast("反物质不足");
        }
    }

    close() {
        this.node.active = false;
    }
}
