import { StarInfo } from "../DataMgr";
import WorldUI from "../WorldUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Star extends cc.Component {

    info: StarInfo;

    setAndRefresh(info: StarInfo) {
        this.info = info;
    }

    refreshZoom(zoomScale: number) {
        if (!this.info) return;
        let curLoc = new cc.Vec2(this.info.x, this.info.y);
        this.node.position = curLoc.mul(zoomScale);
        // this.grpInfo.opacity = WorldUI.Instance.zoomScale > 0.08 || WorldUI.Instance.selectedObjectNode == this.node.parent || this.data == DataMgr.myData ? 255 : 0;
    }

    update(dt: number) {
        if (!this.info) return;
    }

    onClick() {
        WorldUI.Instance.selectArk(this.node);
    }
}
