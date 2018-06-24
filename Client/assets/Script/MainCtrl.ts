import CvsMain from "./CvsMain";
import HomeUI from "./HomeUI";
import { DataMgr, UserData, CargoData, MineInfo, IslandData, TechData } from "./DataMgr";
import WorldUI from "./WorldUI";
import IntroUI from "./UI/IntroUI";
import Island from "./World/Island";
import ToastPanel from "./UI/ToastPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MainCtrl extends cc.Component {
    static Instance: MainCtrl;
    onLoad() {
        MainCtrl.Instance = this;
        CvsMain.Instance.uiContainer.getChildByName('WorldUI').active = true;

        //加载数据
        cc.loader.loadRes('Building', function (err, txt) {
            console.log('Building loaded', txt);
            DataMgr.BuildingConfig = txt;
        }.bind(this));
        cc.loader.loadRes('Cargo', function (err, txt) {
            console.log('Cargo loaded', txt);
            DataMgr.CargoConfig = txt;
        }.bind(this));
        DataMgr.init();
    }

    static Ticks = 0;

    bgmHandler: number;
    start() {
        CvsMain.EnterUI(IntroUI);

        // let as = this.node.getComponent(cc.AudioSource);
        setTimeout(() => {
            // as.play();
            let url = cc.url.raw('resources/audio/bgm.mp3');
            this.bgmHandler = cc.audioEngine.play(url, true, 0.5);
        }, 1000);
    }


    update(dt: number) {
        MainCtrl.Ticks++;
    }
}
