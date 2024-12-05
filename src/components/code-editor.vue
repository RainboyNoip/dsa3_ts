<!-- 对vue3-ace-editor进行封装 

实现功能:

1. 跳转到指定行
2. 高亮指定行
3. 显示代码
-->
<template>
    <v-ace-editor ref="aceRef" v-model:value="rawCode" lang="json" theme="chrome" style="height: 100%; min-height: 800px;" />
</template>

<script lang="ts">
import { VAceEditor } from 'vue3-ace-editor';
import 'ace-builds/src-noconflict/mode-json'; // Load the language definition file used below
import 'ace-builds/src-noconflict/theme-chrome'; // Load the theme definition file used below
export default {
  components: { VAceEditor },

  data() {
    return {
      fakeCode:'123',
      ace:null, // ace实例
      markId:null, // 高亮标记 id
    }
  },
  mounted() {
    //@ts-ignore
    this.ace = this.$refs.aceRef.getAceInstance()
    //@ts-ignore
    this.ace.setReadOnly(true)
  },
  props: {
    code: {
        type: String,
        default:''
    },
    hline_start:{
      type: Number,
      default:-1
    },
    hline_end:{
      type: Number,
      default:-1
    }
  },
  computed: {
    hline(){
      // console.log(this.hline_start,this.hline_end)
      if( this.hline_start != -1 && this.hline_end != -1 && this.hline_end >=this.hline_start)
      {
        return [this.hline_start,this.hline_end]
      }
      return [-1,-1]
    },
    rawCode :{
      get() {
        return this.code
      },
      set(val:string) {
        this.$emit('update:code', val)
      }
    }
  },
  watch: {
    hline(newVal/*,oldVal*/){
      console.log(newVal)
      let [hs,he] = newVal
      if(hs >=0) {
        this.highlightLine(hs,he)
        this.gotoline(hs)
      }
    }
  },
  methods: {
    highlightLine(line_start:number,line_end:number){ 
      //@ts-ignore
      let Range = ace.require('ace/range').Range;
      let range = new Range(line_start, 0, line_end, 1); // 高亮范围（行，列开始，行，列结束）  
      //@ts-ignore
      if(this.markId) this.ace.getSession().removeMarker(this.markId)
      //@ts-ignore
      this.markId = this.ace.getSession().addMarker(range, "highlightLine", "fullLine", true);
    },
    gotoline(line:number) {
      // @ts-ignore
      this.ace.scrollToLine(line, true, true);  
    }
  }
}
</script>

<style>
.highlightLine {
    position: absolute;
    z-index: 20;
    background-color: rgba(17, 199, 8, 0.452);
}
</style>