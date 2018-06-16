import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import MainCtrl from "./MainCtrl";
import { DataMgr, UserData, CargoData, TechData } from "./DataMgr";
import WorldUI from "./WorldUI";
import ToastPanel from "./UI/ToastPanel";
import BlockchainMgr from "./BlockchainMgr";
import DialogPanel from "./DialogPanel";
import EditNicknamePanel from "./UI/EditNicknamePanel";
import { FlagMgr } from "./UI/FlagMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HomeUI extends BaseUI {
    static Instance: HomeUI;
    onLoad() {
        HomeUI.Instance = this;
        this.node.active = false;
    }

    @property(cc.Label)
    lblTotalUserCount: cc.Label = null;

    @property(cc.Button)
    btnWatchGalaxy: cc.Button = null;
    @property(cc.Button)
    btnClaim: cc.Button = null;

    @property(cc.Label)
    lblNickname: cc.Label = null;
    @property(cc.Sprite)
    sprFlag: cc.Sprite = null;
    country: string;

    @property(cc.Label)
    lblMusicButton: cc.Label = null;

    @property(cc.EditBox)
    edtBlockchainAddress: cc.Label = null;

    start() {
        ToastPanel.Toast('正在读取您的钱包信息，如果您在用钱包玩游戏，请稍候');
        this.lblMusicButton.string = MainCtrl.Instance.getComponent(cc.AudioSource).volume > 0 ? '音乐：开' : '音乐：关';
    }

    update() {
        if (DataMgr.myData) {
            this.btnClaim.getComponentInChildren(cc.Label).string = '进入';
            if (DataMgr.myData.nickname) this.lblNickname.string = DataMgr.myData.nickname;
            if (DataMgr.myData.country) this.country = DataMgr.myData.country;
        } else {
            this.btnClaim.getComponentInChildren(cc.Label).string = '领取';
        }

        let self = this;
        if (MainCtrl.Ticks % 50 == 0) FlagMgr.setFlag(this.sprFlag, this.country);
        if (MainCtrl.Ticks % 100 == 0) this.lblTotalUserCount.string = (Object.keys(DataMgr.othersData).length + 1).toFixed();

    }

    onWatchGalaxyClick() {
        console.log('观看银河系，或赞助商入口');
        CvsMain.EnterUI(WorldUI);
    }    

    onClaim() {
        //检查昵称、国家
        if (!this.lblNickname.string || !this.country) {
            EditNicknamePanel.Instance.node.active = true;
            ToastPanel.Toast('请先设置国旗和昵称');
            return;
        }
        if (DataMgr.myData) {
            CvsMain.EnterUI(WorldUI);
        } else {//DataMgr.myData == null
            //调用合约
            BlockchainMgr.Instance.claimNewUser();
        }
    }

    onBtnEditNicknameClick() {
        EditNicknamePanel.Instance.node.active = true;
    }

    onBtnSponsorClick() {
        // CvsMain.EnterUI(WorldUI);
    }

    onInputAddress(edt) {
        console.log('手动输入地址', edt.string);
        const address = edt.string;
        if (address) {
            BlockchainMgr.WalletAddress = address;
            BlockchainMgr.Instance.fetchAllDataCountdown = 1;
        }
    }

    onAddressClick() {
        window.open('https://explorer.nebulas.io/address/' + BlockchainMgr.WalletAddress);
    }

    onBookClick() {
        console.log('哪有白皮书')
    }

    onBtnClearStorageClick() {
        cc.sys.localStorage.clear();
        setTimeout(() => location.reload(), 100);
        console.log('成功清除存储');
    }

    onBtnSwitchMusicClick() {
        const as = MainCtrl.Instance.getComponent(cc.AudioSource);
        as.volume = as.volume > 0 ? 0 : 0.25;
        this.lblMusicButton.string = as.volume > 0 ? '音乐：开' : '音乐：关';
    }
    onInstallWalletClick() {
        window.open("https://github.com/ChengOrangeJu/WebExtensionWallet");
    }

    onTestCheat0Click() {
        DataMgr.myCargoData.forEach(d => d.amount = 1e6);
    }
}