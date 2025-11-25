import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemRank')
export class ItemRank extends Component {
    @property(Label)
    lbName: Label = null;

    @property(Label)
    lbScore: Label = null;

    init(name: string, score: string) {
        this.lbName.string = name;
        this.lbScore.string = score;
    }
}

