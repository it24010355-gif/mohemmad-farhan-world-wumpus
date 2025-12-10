var Environment = function(i, j, width, height) {

    this.i = i;
  	this.j = j;
    this.width = width;
    this.height = height;
    this.removeWalls = false;
    this.visible = [];
    this.holes = [];
    this.wumpus = [];
    this.golds = [];
    this.devices = []; 

    this.level = {};

    this.restart = function(){
        this.visible = this.getMatrix(this.i, this.j);
        this.visible[0][0] = 1; // نقطة البداية دائماً مكشوفة
        this.golds = ArrayUtils.copy(this.level.golds);
		this.holes = ArrayUtils.copy(this.level.holes);
		this.wumpus = ArrayUtils.copy(this.level.wumpus);
        this.devices = ArrayUtils.copy(this.level.devices || []); 
    };

	this.randomInitialization = function(){
        this.level = RandomUtils.getRandomLevel(this.i, this.j);
        this.restart();
    };

    this.getMatrix = function(maxI, maxJ, initialValue){
        var initialValue = initialValue || 0;
        var matrix = new Array(maxI);
        for (var i = 0; i < maxI; i++) {
            matrix[i] = new Array(maxJ);
            for(var j = 0; j < maxJ; j++){
                matrix[i][j] = initialValue;
            }
        }
        return matrix;
    };

    this.removeWumpus = function(deadWumpus){
        this.visible[deadWumpus[0]][deadWumpus[1]] = 1
        this.wumpus = ArrayUtils.removeByValues(this.wumpus, [deadWumpus]);
    };

    this.removeGold = function(gold){
        this.golds = ArrayUtils.removeByValues(this.golds, [gold]);
    };

    this.removeDevice = function(device){
        this.devices = ArrayUtils.removeByValues(this.devices, [device]);
    };

    this.contains = function(array, i, j){
        return this.get(array, i, j) != false;
    }

    this.get = function(array, i, j){
        return ArrayUtils.search(array, [i, j]);
    }

    this.hasAWumpus = function(player){
        for (let i = 0; i < this.wumpus.length; i++) {
            const wumpu = this.wumpus[i];
            if (wumpu[0] == player.getPosI() && wumpu[1] == player.getPosJ()) {
                return true;
            }
        }
        return false;
    };

    this.hasAHole = function(player){
        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];
            if (hole[0] == player.getPosI() && hole[1] == player.getPosJ()) {
                return true;
            }
        }
        return false;
    };

    // --- دالة مساعدة لحساب المسافة ---
    this.getDistance = function(x1, y1, x2, y2) {
        // مسافة مانهاتن (عدد الخطوات)
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    };

    // --- الدالة الرئيسية للرسم (التعديل هنا) ---
    this.draw = function(ctx, player) {

        const breeze = $.i18n("breeze");
        const stench = $.i18n("stench");

        // 1. رسم الأرضية
        for(var i = 0; i < this.i; i++){
            for(var j = 0; j < this.j; j++){
                ctx.drawImage(resources.images['floor'], i*this.width, j*this.height, this.width, this.height);
            }
        }

        // 2. رسم الحفر
        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];
            ctx.drawImage(resources.images['hole'], hole[0]*this.width, hole[1]*this.height, this.width, this.height);
            this.drawText(ctx, breeze, hole[0], hole[1] + 1, 3);
            this.drawText(ctx, breeze, hole[0], hole[1] - 1, 3);
            this.drawText(ctx, breeze, hole[0] + 1, hole[1], 3);
            this.drawText(ctx, breeze, hole[0] - 1, hole[1], 3);
        }

        // 3. رسم الوحوش + منطق الكاشف (الرادار)
        for (let i = 0; i < this.wumpus.length; i++) {
            const wumpu = this.wumpus[i];
            ctx.drawImage(resources.images['wumpus'], wumpu[0]*this.width, wumpu[1]*this.height, this.width, this.height);
            this.drawText(ctx, stench, wumpu[0], wumpu[1]+1, 14);
            this.drawText(ctx, stench, wumpu[0], wumpu[1]-1, 14);
            this.drawText(ctx, stench, wumpu[0]+1, wumpu[1], 14);
            this.drawText(ctx, stench, wumpu[0]-1, wumpu[1], 14);

            // --- كود الرادار الجديد ---
           if (player && player.hasDevice) {
                let dist = this.getDistance(player.getPosI(), player.getPosJ(), wumpu[0], wumpu[1]);
                
                // >>> التغيير هنا: قللنا المسافة من 3 إلى 1 <<<\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
                if (dist <= 1) { 
                    
                    // رسم خط أحمر
                    ctx.beginPath();
                    ctx.moveTo(player.x + this.width/2, player.y + this.height/2);
                    ctx.lineTo(wumpu[0]*this.width + this.width/2, wumpu[1]*this.height + this.height/2);
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; 
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // تحذير
                    ctx.fillStyle = "yellow";
                    ctx.font = "bold 14px Arial";
                    ctx.fillText("!", wumpu[0]*this.width + 10, wumpu[1]*this.height); // اختصرنا النص لعلامة تعجب
                }
            }
            // ------------------------
        }

        // 4. رسم الذهب
        for (let i = 0; i < this.golds.length; i++) {
            const gold = this.golds[i];
			ctx.drawImage(resources.images['floor_gold'], gold[0]*this.width, gold[1]*this.height, this.width, this.height);
            ctx.drawImage(resources.images['gold'], gold[0]*this.width, gold[1]*this.height, this.width, this.height);
        }

        // 5. رسم الأجهزة
        for (let i = 0; i < this.devices.length; i++) {
            const device = this.devices[i];
            ctx.drawImage(resources.images['device'], device[0]*this.width, device[1]*this.height, this.width, this.height);
        }

        // 6. رسم الضباب (الجدران)
        for(var i = 0; i < this.i; i++){
            for(var j = 0; j < this.j; j++){
                
                let isWumpusHere = this.contains(this.wumpus, i, j);
                let reveal = false;

                // المنطق: إذا اللاعب عنده جهاز + المسافة قريبة <= 3
                if (player && player.hasDevice && isWumpusHere) {
                    let dist = this.getDistance(player.getPosI(), player.getPosJ(), i, j);
                    if (dist <= 1) { // نفس مسافة الكشف\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
                        reveal = true;
                    }
                }

                // ارسم الجدار إذا لم يكن مكشوفاً ولم نطلب إزالة الجدران ولم يكشفه الرادار
                if(this.visible[i][j] == 0 && !this.removeWalls && !reveal){
                    ctx.drawImage(resources.images['wall'], i*this.width, j*this.height, this.width, this.height);
                }
            }
        }

        // رسم الخطوط
        for (let i = 1; i < this.i; i++) {
            this.drawLine(ctx, i*this.width, 0, i*this.height, this.j*this.width);
        }
        for (let j = 1; j < this.j; j++) {
            this.drawLine(ctx, 0, j*this.height, this.i*this.width, j*this.height);
        }
	};

    this.drawText = function(ctx, text, i, j, offset){
        ctx.font="12px Verdana";
        ctx.fillStyle = 'white';
        ctx.textBaseline = "hanging";
        ctx.fillText(text, i*this.width+2, j*this.height+offset);
    }

    this.drawLine = function(ctx, x0, y0, x1, y1){
    	ctx.strokeStyle = 'gray';
    	ctx.lineWidth = 1.0;
    	ctx.moveTo(x0+0.5, y0+0.5);
    	ctx.lineTo(x1+0.5, y1+0.5);
    	ctx.stroke();
    }

    this.randomInitialization();
};