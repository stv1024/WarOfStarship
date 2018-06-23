import { StarInfo } from "../DataMgr";
import WorldUI from "../WorldUI";
import BlockchainMgr from "../BlockchainMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Star extends cc.Component {

    index: number;
    info: StarInfo;

    @property(cc.Node)
    btn: cc.Node = null;

    mouseHover = false;

    data: any;

    onLoad() {
        const self = this;
        this.btn.on(cc.Node.EventType.MOUSE_ENTER, () => { self.mouseHover = true; }, this);
        this.btn.on(cc.Node.EventType.MOUSE_LEAVE, () => { self.mouseHover = false; }, this);
    }

    setAndRefresh(index: number, info: StarInfo) {
        this.index = index;
        this.info = info;
    }

    refreshZoom(zoomScale: number) {
        if (!this.info) return;
        let curLoc = new cc.Vec2(this.info.x, this.info.y);
        this.node.position = curLoc.mul(zoomScale);
        this.btn.scale = Math.min(1, zoomScale);
        // this.grpInfo.opacity = WorldUI.Instance.zoomScale > 0.08 || WorldUI.Instance.selectedObjectNode == this.node.parent || this.data == DataMgr.myData ? 255 : 0;
    }

    update(dt: number) {
        this.btn.opacity = (WorldUI.Instance.selectedObjectNode == this.node) || this.mouseHover ? 255 : 0;
        this.btn.color = (WorldUI.Instance.selectedObjectNode == this.node) ? cc.Color.YELLOW : cc.Color.BLUE;
        if (!this.info) return;
    }

    onCircleClick() {
        WorldUI.Instance.selectObject(this.node);
        this.fetchBlockchainData();
    }

    fetchBlockchainData() {
        let self = this;
        BlockchainMgr.Instance.getFunction('getStarData', [this.index], (resp) => { self.data = resp.result; });
    }
}
