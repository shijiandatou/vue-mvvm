class Compile{
    constructor(el,vm){
        this.el = this.isElementNode(el) ? el : document.querySelector(el); //#app document
        this.vm = vm;
        if(this.el){
            //如果这个元素能获取到 我们才能开始编译
            //1.先把真实的dom移入到内存中 fragment
            let fragment = this.nodeToFragment(this.el);
            //2.编译 =》 提取想要的元素节点 v-model 和文本节点{{}}
            this.compile(fragment);

            //3把编译好的 fragment再 赛回到页面中
            this.el.appendChild(fragment);
        }
    }
    /**专门写一些辅助方法 */
    isElementNode(node){
        return node.nodeType === 1;
    }
    //判断是不是指令
    isDirective(name){
        return name.includes('v-');
    }
    /**核心的方法 */
    compileElement(node){
        //带v-model
        let attrs = node.attributes; //取出当前节点的属性

        Array.from(attrs).forEach(attr=>{
            //属性是 name和value 组成的 
            //判断属性名字是不是v-model
            let attrName = attr.name;
            if(this.isDirective(attrName)){
                //取到对应的值放到节点中
                let expr = attr.value;
                let [,type] = attrName.split('-');
                // node vm.data v-model v-text 
                CompileUtil[type](node,this.vm,expr);

            }
        })
    }
    compileText(node){
        //带{{}}
        let text = node.textContent; // 取文本中的内容；
        let reg = /\{\{([^}]+)\}\}/g;//{{a}} {{b}} {{c}}
        if(reg.test(text)){
            //node this.vm.$data text;
            CompileUtil['text'](node,this.vm,text);
        }
        console.log(text);
    }
    compile(fragment){
        //需要递归
        let  childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node=>{
            if(this.isElementNode(node)){
                //是元素节点 还需要继续深入的检查
                //这里需要编译元素
                this.compileElement(node);
                this.compile(node);
            }else{
                //文本节点
                //这里需要编译文本
                this.compileText(node);
            }
        });
    }
    nodeToFragment(el){ //将el中的内容全部放在fragment中
        //这是文档碎片 在内存中
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment; //内存中的节点
    }
}

CompileUtil = {
    getVal(vm,expr){ //获取实例上对应的数据
        expr = expr.split('.'); //[a,v,c,s,a,w,r]
        return expr.reduce((pre,next)=>{ //vm.$data.a
            return pre[next];
        },vm.$data);
    },
    getTextVal(vm,expr){ //获取编译文本后的结果
        return  expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
                        return this.getVal(vm,arguments[1]);
                });
    },
    text(node,vm,expr){ // 文本处理
        let updateFn = this.update['textUpdater'];
       // "message.a" =>[message,a]
       //{{message.a}} => hello ;
       let value = this.getTextVal(vm,expr);
       expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
            new Watcher(vm,arguments[1],(newValue)=>{
                //如果数据变化了 文本节点需要重新获取依赖的属性更新文本中的内容
                updateFn && updateFn(node,this.getTextVal(vm,expr));
            })
        });
       
       updateFn && updateFn(node,value);
      
    },
    model(node,vm,expr){ //输入框处理
        let updateFn = this.update['modelUpdater'];
        //这里应该加个监控 数据变化了 应该调用
        new Watcher(vm,expr,(newValue)=>{
            //当值变化后会调用cb 将新的值传递过来
            //还没用调用update
            updateFn && updateFn(node,this.getVal(vm,expr));
        });
        updateFn && updateFn(node,this.getVal(vm,expr));
    },
    html(){

    },
    update:{
        //文本更新
        textUpdater(node,value){
            node.textContent = value;
        },
        //输入框更新
        modelUpdater(node,value){
            node.value = value;
        }
    }
}