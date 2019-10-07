
var Merge = Phaser.Utils.Objects.Merge;
var Body = Phaser.Physics.Matter.Matter.Body;
var Bodies = Phaser.Physics.Matter.Matter.Bodies;

var game = new Phaser.Game(Merge({
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}, gameConfig));
var cursors;
//var head, spine;
//var standConstraint;
//var standBody;

var player, enemy;
var solidCollides, playerCollides, mouseCollides;
var solidGroup, playerGroup;

function CreateStickPerson(inst, x, y, friendCategory, foeCategory)
{
    this.baseColor = 0xCCCC00;
    this.midColor = this.baseColor - 0x333300;
    this.limbColor = this.midColor - 0x333300;

    this.lineWidth = 16;
    this.headSize = 34;
    this.torsoSize = this.headSize*3;
    this.shoulderSize = this.headSize*2;
    this.hipSize = this.headSize;
    this.upperArmSize = this.headSize*1.5;
    this.lowerArmSize = this.headSize;
    this.upperLegSize = this.headSize*2;
    this.lowerLegSize = this.headSize*2;

    this.handSize = this.headSize/2;
    this.footSize = this.headSize/2;

    this.defaultPhys = {frictionAir: 0.001, friction: 0.1, bounce: 0.5, isStatic: false };

    var yoff=-(this.headSize*1.5+this.lineWidth/2)+y;
    var xoff=x;

    var shoulders = inst.add.rectangle(0, -(this.torsoSize/3), this.shoulderSize, this.lineWidth, this.baseColor);
    var spine = inst.add.rectangle(0, 0, this.lineWidth, this.torsoSize, this.baseColor);
    var hip = inst.add.rectangle(0, this.torsoSize/2, this.hipSize, this.lineWidth, this.baseColor);

    var halfUArmSize = this.upperArmSize/2;
    var halfLArmSize = this.lowerArmSize/2;
    var halfHandSize = this.handSize/2;

    var halfULegSize = this.upperLegSize/2;
    var halfLLegSize = this.lowerLegSize/2;
    var halfFootSize = this.footSize/2;

    var lArmPointX = -this.shoulderSize/2+xoff;
    var rArmPointX = this.shoulderSize/2+xoff;
    var armPointY = -(this.torsoSize/3)+yoff;

    var lLegPointX = -this.hipSize/2+xoff;
    var rLegPointX = this.hipSize/2+xoff;
    var legPointY = this.torsoSize/2+yoff;

    this.parts = {
        head: inst.add.circle(xoff, -this.headSize*2+yoff, this.headSize/2, this.baseColor),
        torso: inst.add.container(xoff, yoff, [spine, shoulders, hip]),
        lUpperArm: inst.add.rectangle(lArmPointX, armPointY+halfUArmSize, this.lineWidth, this.upperArmSize, this.midColor),
        lLowerArm: inst.add.rectangle(lArmPointX, armPointY+this.upperArmSize+halfLArmSize, this.lineWidth, this.lowerArmSize, this.limbColor),
        lHand: inst.add.circle(lArmPointX, armPointY+this.upperArmSize+this.lowerArmSize+halfHandSize, halfHandSize, this.baseColor),
        rUpperArm: inst.add.rectangle(rArmPointX, armPointY+halfUArmSize, this.lineWidth, this.upperArmSize, this.midColor),
        rLowerArm: inst.add.rectangle(rArmPointX, armPointY+this.upperArmSize+halfLArmSize, this.lineWidth, this.lowerArmSize, this.limbColor),
        rHand: inst.add.circle(rArmPointX, armPointY+this.upperArmSize+this.lowerArmSize+halfHandSize, halfHandSize, this.baseColor),
        lUpperLeg: inst.add.rectangle(lLegPointX, legPointY+halfULegSize, this.lineWidth, this.upperLegSize, this.midColor),
        lLowerLeg: inst.add.rectangle(lLegPointX, legPointY+this.upperLegSize+halfLLegSize, this.lineWidth, this.lowerLegSize, this.limbColor),
        lFoot: inst.add.rectangle(lLegPointX-halfFootSize, legPointY+this.upperLegSize+this.lowerLegSize, this.footSize, this.lineWidth, this.baseColor),
        rUpperLeg: inst.add.rectangle(rLegPointX, legPointY+halfULegSize, this.lineWidth, this.upperLegSize, this.midColor),
        rLowerLeg: inst.add.rectangle(rLegPointX, legPointY+this.upperLegSize+halfLLegSize, this.lineWidth, this.lowerLegSize, this.limbColor),
        rFoot: inst.add.rectangle(rLegPointX+halfFootSize, legPointY+this.upperLegSize+this.lowerLegSize, this.footSize, this.lineWidth, this.baseColor),
    };

    this.parts.torso.setSize(this.shoulderSize, this.torsoSize);

    var shoulderBody = Bodies.rectangle(shoulders.x+xoff, shoulders.y+yoff-this.lineWidth/4, shoulders.width, shoulders.height);
    var spineBody = Bodies.rectangle(spine.x+xoff, spine.y+yoff, spine.width, spine.height);
    var hipBody = Bodies.rectangle(hip.x+xoff, hip.y+yoff-this.lineWidth/4, hip.width, hip.height);
    var torsoCompound = Body.create(Merge({
        isStatic: false,
        parts: [spineBody, shoulderBody, hipBody]
    }, this.defaultPhys));

    var addBodyPart = function(part, options)
    {
        options = options || {};
        return inst.matter.add.gameObject(part, Merge(options, this.defaultPhys));
    };

    addBodyPart(this.parts.head, { shape: 'circle', isStatic: false });
    addBodyPart(this.parts.torso);
    addBodyPart(this.parts.lUpperArm);
    addBodyPart(this.parts.lLowerArm);
    addBodyPart(this.parts.lHand, { shape: 'circle' });
    addBodyPart(this.parts.rUpperArm);
    addBodyPart(this.parts.rLowerArm);
    addBodyPart(this.parts.rHand, { shape: 'circle' });
    addBodyPart(this.parts.lUpperLeg);
    addBodyPart(this.parts.lLowerLeg);
    addBodyPart(this.parts.lFoot);
    addBodyPart(this.parts.rUpperLeg);
    addBodyPart(this.parts.rLowerLeg);
    addBodyPart(this.parts.rFoot);

    this.parts.torso.setExistingBody(torsoCompound);

    for (var part in this.parts)
        this.parts[part].setCollisionCategory(friendCategory).setCollidesWith([solidCollides, foeCategory]);

    var jointLength=0, jointStiffness=0.9;

    this.joints = {};
    this.joints.headTorso = inst.matter.add.joint(this.parts.head, this.parts.torso, jointLength, jointStiffness, {
        pointA: { x: 0, y: 0}, pointB: {x: 0, y: -(this.torsoSize/2+this.headSize/2)}
    });

    this.joints.lUpperArmTorso = inst.matter.add.joint(this.parts.lUpperArm, this.parts.torso, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfUArmSize}, pointB: {x: lArmPointX-xoff, y: armPointY-yoff}
    });
    this.joints.lLowerArmLUpperArm = inst.matter.add.joint(this.parts.lLowerArm, this.parts.lUpperArm, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfLArmSize}, pointB: {x: 0, y: halfUArmSize}
    });
    this.joints.lHandLLowerArm = inst.matter.add.joint(this.parts.lHand, this.parts.lLowerArm, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfHandSize}, pointB: {x: 0, y: halfLArmSize}
    });

    this.joints.rUpperArmTorso = inst.matter.add.joint(this.parts.rUpperArm, this.parts.torso, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfUArmSize}, pointB: {x: rArmPointX-xoff, y: armPointY-yoff}
    });
    this.joints.rLowerArmRUpperArm = inst.matter.add.joint(this.parts.rLowerArm, this.parts.rUpperArm, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfLArmSize}, pointB: {x: 0, y: halfUArmSize}
    });
    this.joints.rHandRLowerArm = inst.matter.add.joint(this.parts.rHand, this.parts.rLowerArm, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfHandSize}, pointB: {x: 0, y: halfLArmSize}
    });

    this.joints.lUpperLegTorso = inst.matter.add.joint(this.parts.lUpperLeg, this.parts.torso, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfULegSize}, pointB: {x: lLegPointX-xoff, y: legPointY-yoff}
    });
    this.joints.lLowerLegLUpperLeg = inst.matter.add.joint(this.parts.lLowerLeg, this.parts.lUpperLeg, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfLLegSize}, pointB: {x: 0, y: halfULegSize}
    });
    this.joints.lFootLLowerLeg = inst.matter.add.joint(this.parts.lFoot, this.parts.lLowerLeg, jointLength, jointStiffness, {
        pointA: { x: -halfFootSize, y: 0}, pointB: {x: 0, y: halfLLegSize}
    });

    this.joints.rUpperLegTorso = inst.matter.add.joint(this.parts.rUpperLeg, this.parts.torso, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfULegSize}, pointB: {x: rLegPointX-xoff, y: legPointY-yoff}
    });
    this.joints.rLowerLegRUpperLeg = inst.matter.add.joint(this.parts.rLowerLeg, this.parts.rUpperLeg, jointLength, jointStiffness, {
        pointA: { x: 0, y: -halfLLegSize}, pointB: {x: 0, y: halfULegSize}
    });
    this.joints.rFootRLowerLeg = inst.matter.add.joint(this.parts.rFoot, this.parts.rLowerLeg, jointLength, jointStiffness, {
        pointA: { x: halfFootSize, y: 0}, pointB: {x: 0, y: halfLLegSize}
    });

    var muscleLength=0, muscleStiffness=0.0001;

    this.muscles = {};
    this.muscles.lUpperLegTorso = inst.matter.add.joint(this.parts.lUpperLeg, this.parts.torso, 60, muscleStiffness, {
        pointA: { x: 0, y: halfULegSize}, pointB: {x: lLegPointX-xoff+this.headSize*3, y: legPointY-yoff}
        //pointA: { x: 100, y: 0}, pointB: {x: lLegPointX-xoff+this.headSize*3, y: legPointY-yoff}
    });
    this.muscles.rUpperLegTorso = inst.matter.add.joint(this.parts.rUpperLeg, this.parts.torso, 75, muscleStiffness, {
        //pointA: { x: 0, y: halfULegSize}, pointB: {x: rLegPointX-xoff+this.headSize*3, y: legPointY-yoff}
        pointA: { x: 0, y: halfULegSize}, pointB: {x: 200, y: 0}
    });

    this.muscles.lLowerLegTorso = inst.matter.add.joint(this.parts.lLowerLeg, this.parts.torso, 0, muscleStiffness, {
        pointA: { x: 0, y: halfLLegSize}, pointB: {x: -30, y: upperLegSize*2}
    });
    this.muscles.rLowerLegTorso = inst.matter.add.joint(this.parts.rLowerLeg, this.parts.torso, 0, muscleStiffness, {
        //pointA: { x: 0, y: halfLLegSize}, pointB: {x: -30, y: upperLegSize*2}
        pointA: { x: 0, y: halfLLegSize}, pointB: {x: 200, y: 0}
    });

    //standBody = inst.matter.add.rectangle(head.x, head.y+80, 40, 30, { isStatic: false, collisionFilter: { category: playerColCat } });
    //rLowerLeg.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
    //standConstraint = inst.matter.add.joint(head, standBody, 80, 0.9, { pointA: { x: 0, y: 0}, pointB: {x:0, y:-5} });

    this.extendLLeg = function() {
        var m = this.muscles.lUpperLegTorso;
        m.pointB.x = 200;
        m.pointB.y = 0;
        m.stiffness = 0.5;
    };
    this.retractLLeg = function() {
        var m = this.muscles.lUpperLegTorso;
        m.pointB.x = 200;
        m.pointB.y = 0;
        m.stiffness = 0.5;
    };
    this.relaxLLeg = function() {
        var m = this.muscles.lUpperLegTorso;
        m.stiffness = 0;
    };

    //-------------------------------------------------

    this.extendRLeg = function() {
        var m = this.muscles.rUpperLegTorso;
        var m2 = this.muscles.rLowerLegTorso;
        m.pointB.x = m2.pointB.x = 190;
        m.pointB.y = m2.pointB.y = 0;
        m.stiffness = m2.stiffness = 0.25;
    }.bind(this);
    this.retractRLeg = function() {
        var m = this.muscles.rUpperLegTorso;
        var m2 = this.muscles.rLowerLegTorso;
        m.pointB.x = m2.pointB.x = 0;
        m.pointB.y = m2.pointB.y = 190;
        m.stiffness = m2.stiffness = 0.25;
    };
    this.relaxRLeg = function() {
        var m = this.muscles.rUpperLegTorso;
        var m2 = this.muscles.rLowerLegTorso;
        m.stiffness = m2.stiffness = 0;
    };

    var nextTime = 0;
    var isPressed = true;
    this.update = function(time, delta)
    {

        if (cursors.right.isDown)
        {
            /*if (isReleased)
            {
                this.extendRLeg();

                if (time >= nextTime)
                {
                    nextTime = time+500;
                    this.extendRLeg();
                }
                else
                {
                    this.retractRLeg();
                }
            }*/
            this.extendRLeg();
        }
        else
        {
            isReleased = true;
            this.relaxRLeg();
        }
        //this.muscles.rUpperLegTorso.length = ((Math.sin(time*0.002+20)+1)/2)*120+40;
        //this.muscles.rLowerLegRUpperLeg.length = ((Math.sin(time*0.002+20)+1)/2)*60+10;

        //this.muscles.lUpperLegTorso.length = ((Math.sin(time*0.002)+1)/2)*120+50;
        //this.muscles.lLowerLegLUpperLeg.length = ((Math.sin(time*0.002)+1)/2)*60+10;
    };

    return this;
}

function preload ()
{
}

function create ()
{
    cursors = this.input.keyboard.createCursorKeys();
    solidCollides = this.matter.world.nextCategory();
    playerCollides = this.matter.world.nextCategory();
    enemyCollides = this.matter.world.nextCategory();
    mouseCollides = this.matter.world.nextCategory();

    playerGroup = this.matter.world.nextGroup();
    solidGroup = this.matter.world.nextGroup();

    player = CreateStickPerson(this, 300, 300, playerCollides, enemyCollides);

    enemy = CreateStickPerson(this, 500, 300, enemyCollides, playerCollides);

    var floor = this.add.rectangle(400, 590, 800, 20, 0xCCCCCC);
    this.matter.add.gameObject(floor, { isStatic: true });
    floor.setCollisionCategory(solidCollides).setCollidesWith([playerCollides, enemyCollides]);
    //floor.setCollisionGroup(playerGroup);

    //this.matter.add.mouseSpring({ length: 1, stiffness: 0.6});
    this.matter.add.mouseSpring({ length: 1, stiffness: 0.6, collisionFilter: { category: solidCollides, mask: playerCollides|enemyCollides } });
}

function update(time, delta)
{
    enemy.update(time, delta);
    player.update(time, delta);

}




// var config = {
//     type: Phaser.AUTO,
//     width: 800,
//     height: 600,
//     physics: {
//         default: 'matter',
//         matter: {
//             debug: true,
//             gravity: {
//                 y: 0.3
//             }
//         }
//     },
//     scene: {
//         preload: preload,
//         create: create,
//         update: update
//     }
// };

// var Body = Phaser.Physics.Matter.Matter.Body;
// var Bodies = Phaser.Physics.Matter.Matter.Bodies;

// var game = new Phaser.Game(config);
// var cursors;
// //var head, spine;
// //var standConstraint;
// //var standBody;

// var player;

// function CreateStickPerson(inst, x, y)
// {
//     var Merge = Phaser.Utils.Objects.Merge;
//     this.baseColor = 0xCCCC00;
//     this.midColor = this.baseColor - 0x333300;
//     this.limbColor = this.midColor - 0x333300;

//     this.lineWidth = 8;
//     this.headSize = 24;
//     this.torsoSize = this.headSize*3;
//     this.shoulderSize = this.headSize*2;
//     this.hipSize = this.headSize;
//     this.upperArmSize = this.headSize*1.5;
//     this.lowerArmSize = this.headSize;
//     this.upperLegSize = this.headSize*2;
//     this.lowerLegSize = this.headSize*2;

//     this.handSize = this.headSize/2;
//     this.footSize = this.headSize/2;

//     this.defaultPhys = {frictionAir: 0.001, friction: 0.1, bounce: 0.5, isStatic: false };

//     var yoff=-(this.headSize*1.5+this.lineWidth/2)+y;
//     var xoff=x;

//     var shoulders = inst.add.rectangle(0, -(this.torsoSize/3), this.shoulderSize, this.lineWidth, this.baseColor);
//     var spine = inst.add.rectangle(0, 0, this.lineWidth, this.torsoSize, this.baseColor);
//     var hip = inst.add.rectangle(0, this.torsoSize/2, this.hipSize, this.lineWidth, this.baseColor);

//     var halfUArmSize = this.upperArmSize/2;
//     var halfLArmSize = this.lowerArmSize/2;
//     var halfHandSize = this.handSize/2;

//     var halfULegSize = this.upperLegSize/2;
//     var halfLLegSize = this.lowerLegSize/2;
//     var halfFootSize = this.footSize/2;

//     var lArmPointX = -this.shoulderSize/2+xoff;
//     var rArmPointX = this.shoulderSize/2+xoff;
//     var armPointY = -(this.torsoSize/3)+yoff;

//     var lLegPointX = -this.hipSize/2+xoff;
//     var rLegPointX = this.hipSize/2+xoff;
//     var legPointY = this.torsoSize/2+yoff;

//     this.parts = {
//         head: inst.add.circle(xoff, -this.headSize*2+yoff, this.headSize/2, this.baseColor),
//         torso: inst.add.container(xoff, yoff, [spine, shoulders, hip]),
//         lUpperArm: inst.add.rectangle(lArmPointX, armPointY+halfUArmSize, this.lineWidth, this.upperArmSize, this.midColor),
//         lLowerArm: inst.add.rectangle(lArmPointX, armPointY+this.upperArmSize+halfLArmSize, this.lineWidth, this.lowerArmSize, this.limbColor),
//         lHand: inst.add.circle(lArmPointX, armPointY+this.upperArmSize+this.lowerArmSize+halfHandSize, halfHandSize, this.baseColor),
//         rUpperArm: inst.add.rectangle(rArmPointX, armPointY+halfUArmSize, this.lineWidth, this.upperArmSize, this.midColor),
//         rLowerArm: inst.add.rectangle(rArmPointX, armPointY+this.upperArmSize+halfLArmSize, this.lineWidth, this.lowerArmSize, this.limbColor),
//         rHand: inst.add.circle(rArmPointX, armPointY+this.upperArmSize+this.lowerArmSize+halfHandSize, halfHandSize, this.baseColor),
//         lUpperLeg: inst.add.rectangle(lLegPointX, legPointY+halfULegSize, this.lineWidth, this.upperLegSize, this.midColor),
//         lLowerLeg: inst.add.rectangle(lLegPointX, legPointY+this.upperLegSize+halfLLegSize, this.lineWidth, this.lowerLegSize, this.limbColor),
//         lFoot: inst.add.rectangle(lLegPointX-halfFootSize, legPointY+this.upperLegSize+this.lowerLegSize, this.footSize, this.lineWidth, this.baseColor),
//         rUpperLeg: inst.add.rectangle(rLegPointX, legPointY+halfULegSize, this.lineWidth, this.upperLegSize, this.midColor),
//         rLowerLeg: inst.add.rectangle(rLegPointX, legPointY+this.upperLegSize+halfLLegSize, this.lineWidth, this.lowerLegSize, this.limbColor),
//         rFoot: inst.add.rectangle(rLegPointX+halfFootSize, legPointY+this.upperLegSize+this.lowerLegSize, this.footSize, this.lineWidth, this.baseColor),
//     };

//     this.parts.torso.setSize(this.shoulderSize, this.torsoSize);

//     var shoulderBody = Bodies.rectangle(shoulders.x+xoff, shoulders.y+yoff-this.lineWidth/4, shoulders.width, shoulders.height);
//     var spineBody = Bodies.rectangle(spine.x+xoff, spine.y+yoff, spine.width, spine.height);
//     var hipBody = Bodies.rectangle(hip.x+xoff, hip.y+yoff-this.lineWidth/4, hip.width, hip.height);
//     var torsoCompound = Body.create(Merge({
//         parts: [spineBody, shoulderBody, hipBody]
//     }, this.defaultPhys));

//     //inst.matter.add.gameObject(this.parts.head, this.defaultPhys);
//     //inst.matter.add.gameObject(this.parts.spine, this.defaultPhys);

//     // this.container = inst.add.container(400, 300, [
//     //     this.parts.head, this.parts.torso,
//     //     this.parts.lUpperArm, this.parts.lLowerArm, this.parts.lHand,
//     //     this.parts.rUpperArm, this.parts.rLowerArm, this.parts.rHand,
//     //     this.parts.lUpperLeg, this.parts.lLowerLeg, this.parts.lFoot,
//     //     this.parts.rUpperLeg, this.parts.rLowerLeg, this.parts.rFoot,
//     // ]);

//     //this.container.setSize(this.shoulderSize+this.lineWidth/2, this.headSize*8);
//     //inst.matter.add.gameObject(this.container, this.defaultPhys);

//     inst.matter.add.gameObject(this.parts.head, Merge({ shape: 'circle', isStatic: false }, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.torso);
//     this.parts.torso.setExistingBody(torsoCompound);

//     inst.matter.add.gameObject(this.parts.lUpperArm, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.lLowerArm, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.lHand, Merge({ shape: 'circle' }, this.defaultPhys));

//     inst.matter.add.gameObject(this.parts.rUpperArm, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.rLowerArm, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.rHand, Merge({ shape: 'circle' }, this.defaultPhys));

//     inst.matter.add.gameObject(this.parts.lUpperLeg, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.lLowerLeg, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.lFoot, Merge({}, this.defaultPhys));

//     inst.matter.add.gameObject(this.parts.rUpperLeg, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.rLowerLeg, Merge({}, this.defaultPhys));
//     inst.matter.add.gameObject(this.parts.rFoot, Merge({}, this.defaultPhys));


//     this.update = function()
//     {

//     };

//     return this;
// }

// function preload ()
// {
//     //this.load.setBaseURL('http://labs.phaser.io');

//     //this.load.image('sky', 'assets/skies/space3.png');
//     //this.load.image('logo', 'assets/sprites/phaser3-logo.png');
//     //this.load.glsl('test', 'Shaders/test.frag');
// }

// function create ()
// {
//     cursors = this.input.keyboard.createCursorKeys();

//     player = CreateStickPerson(this, 400, 300);

//     var floor = this.add.rectangle(400, 590, 800, 20, 0xCCCCCC);
//     this.matter.add.gameObject(floor, { isStatic: true });


//     //this.add.shader('test', 400, 300, 800, 600);

//     //this.add.text(400, 300, 'Nothing', { fontFamily: 'Rock Salt', fontSize: 72, color: '#ff0000'})
//     //        .setShadow(2, 2, "#333333", 2, false, true);



//     // var playerPhys = { mass: 5, friction: 0.5};

//     // var floor = this.add.rectangle(400, 590, 800, 20, 0xCCCCCC);


//     // head = this.add.circle(400, 300, 15, 0xBBBB00);


//     // var shoulders = this.add.rectangle(400, 315, 35, 6, 0xBBBB00);
//     // spine = this.add.rectangle(400, 315, 6, 30, 0xBBBB00);

//     // var lUpperArm = this.add.rectangle(380, 315, 25, 6, 0xBBBB00);
//     // var rUpperArm = this.add.rectangle(420, 315, 25, 6, 0xBBBB00);

//     // var lLowerArm = this.add.rectangle(360, 315, 25, 6, 0xBBBB00);
//     // var rLowerArm = this.add.rectangle(360, 315, 25, 6, 0xBBBB00);

//     // var lUpperLeg = this.add.rectangle(400, 330, 6, 25, 0xBBBB00);
//     // var rUpperLeg = this.add.rectangle(400, 330, 6, 25, 0xBBBB00);

//     // var lLowerLeg = this.add.rectangle(400, 330, 6, 25, 0xBBBB00);
//     // var rLowerLeg = this.add.rectangle(400, 330, 6, 25, 0xBBBB00);

//     // var playerColCat = this.matter.world.nextCategory();
//     // var solidColCat = this.matter.world.nextCategory();

//     // this.matter.add.gameObject(floor, { isStatic: true });

//     // this.matter.add.gameObject(head, { shape: 'circle', isStatic: false, mass: 5 });
//     // this.matter.add.gameObject(spine, playerPhys);
//     // this.matter.add.gameObject(shoulders, playerPhys);

//     // this.matter.add.gameObject(lUpperArm, playerPhys);
//     // this.matter.add.gameObject(rUpperArm, playerPhys);

//     // this.matter.add.gameObject(lLowerArm, playerPhys);
//     // this.matter.add.gameObject(rLowerArm, playerPhys);

//     // this.matter.add.gameObject(lUpperLeg, playerPhys);
//     // this.matter.add.gameObject(rUpperLeg, playerPhys);

//     // this.matter.add.gameObject(lLowerLeg, playerPhys);
//     // this.matter.add.gameObject(rLowerLeg, playerPhys);

//     // head.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
//     // spine.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
//     // shoulders.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);

//     // lUpperArm.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
//     // rUpperArm.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);

//     // lLowerArm.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
//     // rLowerArm.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);

//     // lUpperLeg.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
//     // rUpperLeg.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);

//     // lLowerLeg.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
//     // rLowerLeg.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);

//     // floor.setCollisionCategory(solidColCat).setCollidesWith([playerColCat]);

//     // this.matter.add.joint(head, spine, 1, 0.1, { pointA: { x: 0, y: 15}, pointB: {x:0, y:-15}});
//     // this.matter.add.joint(shoulders, spine, 1, 0.1, { pointA: { x: 0, y: 0}, pointB: {x:0, y:-15}});

//     // this.matter.add.joint(lUpperArm, shoulders, 1, 0.1, { pointA: { x: 12, y: 0}, pointB: {x:-17, y:0}});
//     // this.matter.add.joint(rUpperArm, shoulders, 1, 0.1, { pointA: { x: -12, y: 0}, pointB: {x:17, y:0}});

//     // this.matter.add.joint(lLowerArm, lUpperArm, 1, 0.1, { pointA: { x: 12, y: 0}, pointB: {x:-12, y:0} });
//     // this.matter.add.joint(rLowerArm, rUpperArm, 1, 0.1, { pointA: { x: -12, y: 0}, pointB: {x:12, y:0} });

//     // this.matter.add.joint(lUpperLeg, spine, 1, 0.1, { pointA: { x: 0, y: -12}, pointB: {x:-5, y:15} });
//     // this.matter.add.joint(rUpperLeg, spine, 1, 0.1, { pointA: { x: 0, y: -12}, pointB: {x:5, y:15} });

//     // this.matter.add.joint(lLowerLeg, lUpperLeg, 1, 0.1, { pointA: { x: 0, y: 12}, pointB: {x:0, y:12} });
//     // this.matter.add.joint(rLowerLeg, rUpperLeg, 1, 0.1, { pointA: { x: 0, y: 12}, pointB: {x:0, y:12} });

//     // standBody = this.matter.add.rectangle(head.x, head.y+80, 40, 30, { isStatic: false, collisionFilter: { category: playerColCat } });
//     // rLowerLeg.setCollisionCategory(playerColCat).setCollidesWith([solidColCat]);
//     // standConstraint = this.matter.add.joint(head, standBody, 80, 0.9, { pointA: { x: 0, y: 0}, pointB: {x:0, y:-5} });

//     // standConstraint = this.matter.add.worldConstraint(head, 30, 0.9, {
//     //     pointA: { x: head.x, y: head.y+30 },
//     //     pointB: { x: 0, y: 0 }
//     // });
//     // console.log(standConstraint);
//     //this.matter.world.setBounds();
//     //head.setInteractive();
//     //this.matter.add.mouseSpring({ length: 1, stiffness: 0.6, collisionFilter: { mask: playerColCat } });
// }

// function update()
// {
//     player.update();
//     // if (head.y > standBody.position.y)
//     // {
//     //     head.y -= 60;
//     //     console.log('here');
//     // }
//     // Body.setPosition(standBody, {x:head.x, y:standBody.position.y});
//     // Body.setAngle(standBody, 0);
//     // standBody.slop -= 0.5;

//     // if (cursors.left.isDown)
//     // {
//     //     spine.setVelocityX(-2);
//     //     spine.setVelocityY(-0.1);
//     // }
//     // if (cursors.right.isDown)
//     // {
//     //     spine.setVelocityX(2);
//     //     spine.setVelocityY(-0.1);
//     // }
// }
