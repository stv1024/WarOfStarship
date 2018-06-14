"use strict";

let User = function () {
    let rad = Math.random() * Math.PI;
    this.nickname = "";
    this.address = "";
    this.country = "";
    this.state = 0; //0:sailing 1:collecting
    this.hull = 1; //完整度
    this.expandCnt = 0;
    let locData = {};
    locData.speed = 0;
    locData.lastLocationX = Math.cos(rad) * 5000;
    locData.lastLocationY = Math.sin(rad) * 5000;
    locData.destinationX = null;
    locData.destinationY = null;
    locData.lastLocationTime = (new Date()).valueOf();
    //this.rechargeOnExpand = new BigNumber(0);
    this.locationData = locData;
    this.buildingData = {

    };
    this.cargoData = {
        energy: 0,
        iron: 0,
    };
};

User.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let Island = function (jsonStr) {
    if (jsonStr) {
        let obj = JSON.parse(jsonStr);
        this.id = obj.id;
        this.occupant = obj.occupant;
        this.lastMineTime = obj.lastMineTime;
        this.fighterPower = obj.fighterPower;
        this.money = new BigNumber(obj.money);
        this.sponsor = obj.sponsor;
        this.sponsorName = obj.sponsorName;
        this.sponsorLink = obj.sponsorLink;
        this.mineSpeed = obj.mineSpeed;
        this.minberBalance = obj.minberBalance;
        this.lastBattleTime = obj.lastBattleTime;
    } else {
        this.id = 0;
        this.occupant = "";
        this.lastMineTime = 0; // 上次开发挖矿的时间
        this.fighterPower = 0;
        this.money = new BigNumber(0);
        this.sponsor = "";
        this.sponsorName = "";
        this.sponsorLink = "";
        this.mineSpeed = 0.0001;
        this.minberBalance = 0;
        this.lastBattleTime = 0;
    }
};

Island.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let BigNumberDesc = {
    parse: function (jsonText) {
        return new BigNumber(jsonText);
    },
    stringify: function (obj) {
        return obj.toString();
    }
}

let GameContract = function () {
    LocalContractStorage.defineProperty(this, "adminAddress");
    LocalContractStorage.defineProperty(this, "totalIslandCnt");
    LocalContractStorage.defineProperty(this, "maxArkPrice", BigNumberDesc);
    LocalContractStorage.defineProperty(this, "totalNas", BigNumberDesc);
    LocalContractStorage.defineProperty(this, "allArkList", {
        parse: function (jsonText) {
            return JSON.parse(jsonText);
        },
        stringify: function (obj) {
            return JSON.stringify(obj);
        }
    })
    LocalContractStorage.defineMapProperty(this, "allUsers", {
        parse: function (jsonText) {
            return new User(jsonText);
        },
        stringify: function (obj) {
            return obj.toString();
        }
    });
    LocalContractStorage.defineMapProperty(this, "allIslands", {
        parse: function (jsonText) {
            return new Island(jsonText);
        },
        stringify: function (obj) {
            return obj.toString();
        }
    });
}

GameContract.prototype = {
    init: function () {
        this.adminAddress = "n1bXKq7e2rP6U32z4WHrKW8NTZWsqfhyotb";
        this.maxArkPrice = new BigNumber(1e17);
        this.totalNas = new BigNumber(0);
        this.shipSpeed = 100;
        this.energyCostPerLyExpand = 1;
        this.allUserList = [];
        this.totalIslandCnt = 0;
    },
    claim_new_user: function (nickname, country) {
        if (nickname.length > 100) {
            throw new Error("Nickname is too long.");
        }
        if (country.length > 20) {
            throw new Error("Country name is too long.");
        }
        let user = new User();
        let userAddress = Blockchain.transaction.from;
        let value = Blockchain.transaction.value;

        if (this.allUsers.get(userAddress) !== null) {
            throw new Error("Has claim new user before.")
        }

        this.totalNas = value.plus(this.totalNas);
        user.nickname = nickname;
        user.country = country;
        user.address = userAddress;
        this.allUsers.set(userAddress, user);
        let allUserList = this.allUserList;
        allUserList.push(userAddress);
        this.allUserList = allUserList;

        return {
            "success": true,
            "result_data": user
        };
    },
    move: function (destinationX, destinationY) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        if ((locationX !== null && user.locationX !== obj.locationX) ||
            (locationY !== null && user.locationY !== obj.locationY)) {
        }
        this._recalcUser(user);
        user.speed = this.shipSpeed;
        user.destinationX = destinationX;
        user.destinationY = destinationY;
        let energyCost = this._getSailEnergyCost(user);
        if (user.cargoData.energy < energyCost) {
            throw new Error("User energy NOT enough.");
        }

        user.cargoData.energy -= energyCost;

        this.allUsers.set(userAddress, user);

        return {
            "success": true,
            "result_data": user
        };
    },
    recharge_expand: function () {
        let userAddress = Blockchain.transaction.from;
        let ark = this.allUsers.get(userAddress);
        let value = Blockchain.transaction.value;
        if (ark === null) {
            throw new Error("User should have ark.");
        }
        this.totalNas = this.totalNas.plus(value);
        ark.rechargeOnExpand = ark.rechargeOnExpand.plus(value);
        this.allUsers.set(userAddress, ark);

        return {
            "success": true,
            "result_data": ark
        };
    },
    get_map_info: function () {
        let allArks = this.allUsers
        let arkInfo = this.allUserList.map(function (address) {
            return allArks.get(address);
        });
        let islandInfo = [];
        for (let i = 0; i < this.totalIslandCnt; i++) {
            islandInfo.push(this.allIslands.get(i));
        }
        return {
            "success": true,
            "result_data": {
                "ark_info": arkInfo,
                "island_info": islandInfo
            }
        };
    },
    get_user_list: function () {
        return {
            "success": true,
            "result_data": this.allUserList
        };
    },
    get_user: function (address) {
        return {
            "success": true,
            "result_data": this.allUsers.get(address)
        };
    },
    attack_island: function (islandId, tankPower, chopperPower, shipPower) {
        let isLand = this.allIslands.get(islandId);
        let userAddress = Blockchain.transaction.from;
        let ark = this.allUsers.get(userAddress);
        let curTs = (new Date()).valueOf();
        if (isLand === null) {
            throw new Error("Error island id.");
        }
        if (ark === null) {
            throw new Error("User should have ark.");
        }
        let powerAttenuRate = new BigNumber(0.05);
        let hoursDelta = (new BigNumber(curTs - isLand.lastBattleTime)).div(1000 * 3600);
        let attenu = Math.exp(powerAttenuRate.times(hoursDelta).negated());
        isLand.tankPower = Math.round(isLand.tankPower * attenu);
        isLand.chopperPower = Math.round(isLand.chopperPower * attenu);
        isLand.shipPower = Math.round(isLand.shipPower * attenu);
        isLand.lastBattleTime = curTs;
        if (isLand.occupant === "" || isLand.occupant === userAddress) { // 没有被占领或者自己占领
            if (isLand.occupant === "") {
                isLand.lastMineTime = curTs;
            }
            isLand.occupant = userAddress;
            isLand.chopperPower += chopperPower;
            isLand.tankPower += tankPower;
            isLand.shipPower += shipPower;
            this.allIslands.set(islandId, isLand);
            return {
                "success": true,
                "result_data": isLand
            };
        } else {
            let res = this._battle(isLand.tankPower, isLand.chopperPower, isLand.shipPower,
                tankPower, chopperPower, shipPower)
            if (res["win"]) { // 防守失败
                this._collect_island_money_proc(isLand); // 把上个玩家挖到的钱发给该玩家
                isLand = this.allIslands.get(islandId); // 这边要重新获取，因为money会改变
                isLand.occupant = userAddress;
                isLand.lastMineTime = curTs;
            }
            isLand.tankPower = res['left'][0];
            isLand.chopperPower = res['left'][1];
            isLand.shipPower = res['left'][2];

            this.allIslands.set(islandId, isLand);
            return {
                "success": res["win"],
                "result_data": isLand
            };
        }
    },
    _getSailEnergyCost: function (user) {
        let locData = user.locationData;
        if (locData.destinationX === null || locData.destinationY === null) return 0;
        let dX = locData.destinationX - locData.lastLocationX;
        let dY = locData.destinationY - locData.lastLocationY;
        let dist = Math.sqrt(dX * dX + dY * dY);
        return dist * (user.expandCnt + 5) * energyCostPerLyExpand;
    },
    _lerpVec2: function (a, b, t, clamp) {
        if (clamp) t = Math.max(0, Math.min(1, t));
        let res = {};
        res.x = a.x * (1 - t) + b.x * t;
        res.y = a.y * (1 - t) + b.y * t;
        return res;
    },
    _recalcUser: function (user) {
        //location
        let locData = user.locationData;
        if (locData.destinationX === null || locData.destinationY === null) return 0;
        let dX = locData.destinationX - locData.lastLocationX;
        let dY = locData.destinationY - locData.lastLocationY;
        let dist = Math.sqrt(dX * dX + dY * dY);
        let needTime = dist / user.locationData.speed;
        let curTime = (new Date()).valueOf();
        let t = (curTime - user.locationData.lastLocationTime) / needTime;
        if (t < 1) {
            let curLoc = this._lerpVec2({ x: locData.lastLocationX, y: locData.lastLocationY }, { x: locData.destinationX, y: locData.destinationY }, t, false);
            locData.lastLocationX = curLoc.x;
            locData.lastLocationY = curLoc.y;
        } else {
            locData.lastLocationX = locData.destinationX;
            locData.lastLocationY = locData.destinationY;
            locData.destinationX = null;
            locData.destinationY = null;
        }
        locData.lastLocationTime = curTime;
        user.locationData = locData;

        //building-cargo
    },
    _battle: function (bb1, cc1, dd1, bb2, cc2, dd2) { /*策划设定*/
        let c1 = 20; /*攻击方坦克攻击*/
        let d1 = 100; /*攻击方坦克HP*/
        let e1 = 50; /*攻击方直升机攻击*/
        let f1 = 40; /*攻击方直升机HP*/
        let g1 = 100; /*攻击方炮舰攻击*/
        let h1 = 20; /*攻击方炮舰HP*/

        let c2 = 20; /*防守方坦克攻击*/
        let d2 = 100; /*防守方坦克HP*/
        let e2 = 50; /*防守方直升机攻击*/
        let f2 = 40; /*防守方直升机HP*/
        let g2 = 100; /*防守方炮舰攻击*/
        let h2 = 20; /*防守方炮舰HP*/

        let k3 = 1; /*防守方属性加成*/
        let k1 = 0; /*防守方属性加成*/
        let k2; /*打肉系数-随机*/

        /*计算变量*/
        let y; /*战力差/剩余*/
        let a; /*剩余比例*/

        let z1; /*攻击方总战力*/
        let z2; /*防守方总战力*/

        /*输出变量*/
        let x; /*胜负，0为攻击方胜，1为防守方胜*/
        let bb; /*获胜方坦克数量*/
        let cc; /*获胜方直升机数量*/
        let dd; /*获胜方炮舰数量*/

        /*胜负判断*/
        z1 = (c1 * bb1 ** (k3) + e1 * cc1 ** (k3) + g1 * dd1 ** (k3)) *
            (d1 * bb1 + f1 * cc1 + h1 * dd1);

        z2 = (c2 * bb2 + e2 * cc2 ** (k3) + g2 * dd2 ** (k3)) * (1 + k1) *
            (d2 * bb2 + f2 * cc2 + h2 * dd2);

        y = z1 - z2;

        if (y >= 0) {
            x = false
        } else {
            x = true
        }

        /*获胜方剩余兵力*/
        if (x == 0) {
            a = y / z1;
            k2 = 1 - Math.random() * 0.3;
            bb = Math.floor(bb1 * a * k2);
            cc = Math.min(cc1, Math.floor(cc1 * a + bb1 * a * (1 - k2) * d1 / 2 / f1));
            dd = Math.min(dd1, Math.floor(dd1 * a + bb1 * a * (1 - k2) * d1 / 2 / h1));
        } else {
            a = -y / z2;
            k2 = 1 - Math.random() * 0.3;
            bb = Math.floor(bb2 * a * k2);
            cc = Math.min(cc2, Math.floor(cc2 * a + bb2 * a * (1 - k2) * d2 / 2 / f2));
            dd = Math.min(dd2, Math.floor(dd2 * a + bb2 * a * (1 - k2) * d2 / 2 / h2));

        }

        console.log(bb1, cc1, dd1, '|', bb2, cc2, dd2, '获胜方', x, '剩余', bb, cc, dd);
        return {
            "win": x,
            "left": [bb, cc, dd]
        }
    },
    collect_island_money: function (islandId) {
        let isLand = this.allIslands.get(islandId);
        let userAddress = Blockchain.transaction.from;
        if (isLand === null || isLand.occupant !== userAddress) {
            throw new Error("Error island id.")
        }
        let mineMoney = this._collect_island_money_proc(isLand);

        return {
            "success": true,
            "result_data": mineMoney
        };
    },
    _collect_island_money_proc: function (isLand) {
        let curTs = (new Date()).valueOf();
        let hoursDelta = (new BigNumber(curTs - isLand.lastMineTime)).div(1000 * 3600);
        let leftNas = isLand.money.times(Math.exp(isLand.miningRate.times(hoursDelta).negated()).toString()).trunc();
        let MiningNas = isLand.money.minus(leftNas);

        isLand.money = leftNas;
        isLand.lastMineTime = curTs;
        this.allIslands.set(isLand.id, isLand);
        this._transaction(isLand.occupant, MiningNas);

        return MiningNas;
    },
    _transaction: function (targetAddress, value) {
        var result = Blockchain.transfer(targetAddress, value);
        console.log("transfer result:", result);
        Event.Trigger("transfer", {
            Transfer: {
                from: Blockchain.transaction.to,
                to: targetAddress,
                value: value
            }
        });
    },
    sponsor: function (islandId, sponsorName, link) {
        let isLand = this.allIslands.get(islandId);
        let value = Blockchain.transaction.value;
        let userAddress = Blockchain.transaction.from;
        let res;
        if (isLand === null) {
            throw new Error("Error island id.");
        }
        this.totalNas = value.plus(this.totalNas);
        this._collect_island_money_proc(islandId);
        if (value >= isLand.money.times(1.2) || isLand.sponsor === userAddress) {
            isLand.sponsor = userAddress;
            isLand.sponsorName = sponsorName;
            isLand.sponsorLink = link;
            res = {
                "success": true
            };
        } else {
            res = {
                "success": false,
                "result_data": "No enough money."
            };
        }
        isLand.money = value.plus(isLand.money);
        this.allIslands.set(islandId, isLand);

        return res;
    },
    changeConst: function (constName, value) {
        if (Blockchain.transaction.from !== this.adminAddress) {
            throw new Error("Permission denied.");
        }
        this[constName] = value;
    },
    take_redundant_nas: function (targetAddress, value) {
        if (Blockchain.transaction.from != this.adminAddress) {
            throw new Error("Permission denied.");
        }
        if (Blockchain.verifyAddress(targetAddress) == 0) {
            throw new Error("Illegal Address.");
        }

        this._transaction(targetAddress, new BigNumber(value))
    }
}


module.exports = GameContract;