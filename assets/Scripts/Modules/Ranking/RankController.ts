import { _decorator, Component, Node, Label } from 'cc';
import { requestRank } from '../../Managers/APIManager';
import { PopupBase } from '../Popups/PopupBase';
import { ItemRank } from './ItemRank';
const { ccclass, property } = _decorator;

@ccclass('RankController')
export class RankController extends PopupBase {

    @property(Label)
    lbNoti: Label = null;
    
    @property(Node)
    nodeUserContainer: Node = null;

    itemRanks: ItemRank[] = [];

    onEnable() {
        this.init();
    }

    init() {
        this.itemRanks = this.nodeUserContainer.getComponentsInChildren(ItemRank);
        this.lbNoti.string = "ĐANG TẢI...";
        requestRank(res => {
            if (res.isSuccess) {
                this.setData(res.data);
            }
            else {
                this.setNoData();
            }
        })
    }

    setData(users) {
        if (users.length <= 0) {
            this.setNoData();
            return;
        }
        this.lbNoti.string = "";
        for (var i = 0; i < this.itemRanks.length; i++) {
            let isActive = i < users.length;
            this.itemRanks[i].node.active = isActive;
            if (isActive) {
                this.itemRanks[i].init(users[i].player_name, users[i].sum)
            }
        }
    }

    setNoData() {
        this.lbNoti.string = "DANH SÁCH RỖNG";
    }
}

