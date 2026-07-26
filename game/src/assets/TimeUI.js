class UIClock extends Phaser.Scene
{
    constructor() { super('UIClock'); }
    preload() { }
    create() {
        this.time.addEvent({ delay: 1000, callback: () => {
            this.time.text = new Date().toLocaleTimeString();
        }, loop: true});
    }
}