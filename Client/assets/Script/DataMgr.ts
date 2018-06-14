import WorldUI from "./WorldUI";
import MathUtil from "./Utils/MathUtil";

export class DataMgr {

    static myData: UserData;
    static myCargoData: CargoData[];
    static myBuildingData: BuildingData[];

    static othersData = {};
    static allIslandData = {};

    static BuildingConfig: BuildingInfo[];
    static CargoConfig: CargoInfo[];

    static changed = false;
    static outputRates = {};

    static shipSpeed = 100;
    static energyCostPerLyExpand = 1;

    static getUserCurrentLocation(user) {
        let lastLocation = new cc.Vec2(user.locationData.lastLocationX, user.locationData.lastLocationY);
        if (user.locationData.destinationX == null || user.locationData.destinationY == null) return lastLocation;
        let destination = new cc.Vec2(user.locationData.destinationX, user.locationData.destinationY);
        let dist = lastLocation.sub(destination).mag();
        let time = dist / (user.speed / 60 / 1000);
        let t = (Number(new Date()) - user.locationData.lastLocationTime) / time;
        return MathUtil.lerpVec2(lastLocation, destination, t, true);
    }

    static getMethaneCostOfAttack(distance: number, tankPower, chopperPower, shipPower) {
        return 0.01 * distance * (tankPower + chopperPower + shipPower);
    }

    static calcCurrentMoneyInIsland(data: IslandData): number {
        const isMining = data.occupant && data.occupant.length > 0;
        let curMoney = data.money * (isMining ? Math.exp(-data.miningRate * (Number(new Date()) - data.lastMineTime) / (1000 * 3600)) : 1);
        return curMoney;
    }
}


export class LocationData {
    speed: number; //ly/分钟
    lastLocationX: number;
    lastLocationY: number;
    lastLocationTime: number;
    destinationX: number;
    destinationY: number;
}
export class UserData {
    nickname: string;
    address: string; //区块链地址
    country: string;
    expandCnt = 0;
    locationData: LocationData;
    cargoData = {
        energy: 0,
    };
}
export class BuildingInfo {
    id: string;
    Name: string;
    Length: number;
    Width: number;
    MaxHuman;
}
export class BuildingData {
    id: string;
    ij: IJ;
    workers: number = 0;

    isWorking = false;
}
export class CargoInfo {
    id: string;
    Name: string;
}
export class CargoData {
    id: string;
    amount: number = 0;
}
export class TechInfo {
    id: string;
    Name: string;
    Work: number;
}
export class TechData {
    id: string;
    filledWork: number;
    finished: boolean;
}
export class MineInfo {
    polygonCollider: cc.PolygonCollider;
    points: cc.Vec2[];
}
export class IslandData {
    location: cc.Vec2;
    id: number;
    occupant: string; //当前占领者addr
    tankPower: number = 0;
    chopperPower: number = 0;
    shipPower: number = 0;
    money: number = 0; //里面还有多少nas
    sponsor: string;//赞助商账号
    sponsorName: string = '';//赞助商名称
    sponsorLink: string;//赞助商链接
    // minMiningSpeed: number = 0.04167; //NAS/h 挖矿速度
    miningRate: number = 0.02;///h 挖矿百分比速度，实际挖矿速度=max(minMiningSpeed, money*miningRate）
    balanceMap: number = 0; //当前占领者可收获的NAS
    lastMineTime: number; //当前数据的时间戳
    lastBattleTime: number;
}
export class IJ {
    i: number = 0;
    j: number = 0;

    clone() {
        let ij = new IJ();
        ij.i = this.i;
        ij.j = this.j;
        return ij;
    }
    static get ZERO(): IJ {
        return new IJ();
    }
}