import { _decorator, Component, Node, UITransform, size, Widget, warnID } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UISizeByScreen')
export class UISizeByScreen extends Component {
    @property(UITransform)
    target: UITransform = null;

    start() {
        if (this.target == null) return;

        //set by screen width if screen larger than max then set to max
        var screenWidth = cc.visibleRect.width;
        if (screenWidth < this.target.width) {
            var ratio = this.target.height / this.target.width;
            var newWidth = screenWidth;
            var newHeight = newWidth * ratio;
            this.target.setContentSize(size(newWidth, newHeight))

            var widgets = this.getComponentsInChildren(Widget);
            widgets.forEach(wg => {
                wg.updateAlignment();
            })
        }
    }
}

