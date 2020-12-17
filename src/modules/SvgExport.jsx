/**
 * class for handling svg export
 * TODO: tidy up
 */
//import React, { Component }  from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

class SvgExport {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.exportSVG = this.exportSVG.bind(this);
        this.exportSVGandData = this.exportSVGandData.bind(this);
        this.exportPNG = this.exportPNG.bind(this);
        this.exportPDF = this.exportPDF.bind(this);
        this.getSampleVarTree = this.getSampleVarTree.bind(this);
        this.getEventVarTree = this.getEventVarTree.bind(this)

    }

    /**
     * exports current view
     */
    exportSVG() {
        var tmp;
        if (this.rootStore.uiStore.globalTime==='line') {
            tmp = document.getElementById("timeline-view");
        } else {
            tmp = document.getElementById("block-view");
        }
        var svg_all = Array.from(tmp.getElementsByTagName("svg"));

        svg_all.sort((svg1, svg2) => {
            return svg1.getBoundingClientRect().left-svg2.getBoundingClientRect().left
        });

        var print_svg = '';

        var minW = null, minH = null, maxW = null, maxH = null;

        var prev_right = 0, new_x, new_right;


        for (var i = 0; i < svg_all.length; i++) {
            var t = "";

            var svg_copy = svg_all[i].cloneNode(true);
            var a = svg_copy.getElementsByClassName("not_exported");
            [...a].forEach(t => {
                t.remove();
            })


            for (var c = 0; c < svg_copy.children.length; c++) {
                var temp = svg_copy.children[c];

                t = t + (new XMLSerializer()).serializeToString(temp);
            }

            var boundingRect; // = svg_all[i].parentElement.getBoundingClientRect();

            if (this.rootStore.uiStore.globalTime==='line' && this.rootStore.dataStore.transitionOn && (i === 0 || i === 1)) {
                boundingRect = svg_all[i].getBoundingClientRect();
            }
            else {
                boundingRect = svg_all[i].parentElement.getBoundingClientRect();
            }
            var width = svg_all[i].getBoundingClientRect().width;
            var height = svg_all[i].getBoundingClientRect().height;

            new_x = boundingRect.x;
            new_right = new_x + width;

            if (boundingRect.x < prev_right && this.rootStore.uiStore.globalTime.includes('block')) {

                
                new_right = prev_right + width;
                new_x = prev_right;
            }

            prev_right = new_right - 1;

            if (minW===null || boundingRect.left < minW) {
                minW = boundingRect.left;
            }
            if (maxW===null || new_right > maxW) {
                maxW = new_right;
            }
            if (minH===null || boundingRect.top > minH) {
                minH = boundingRect.top;
            }
            if (maxH===null || boundingRect.bottom > maxH) {
                maxH = boundingRect.bottom;
            }

            var scaleX = 1;

            if (this.rootStore.uiStore.globalTime==='line' && this.rootStore.dataStore.transitionOn && i === 4) {
                // if(this.rootStore.dataStore.transitionOn && i===4){

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +

                    t +

                    '</g>';

            }
            else if (this.rootStore.uiStore.globalTime==='line' && !this.rootStore.dataStore.transitionOn && i === 3) {

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +
                    t +
                    '</g>';
               

            } else {
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ')" >' +

                    t +

                    '</g>';
            }
        }

        

        var svg_xml = '<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial" width = "' + (minW + maxW).toString() + '" height= "' + (minH + maxH).toString() + '">' +

            // svg_prefix +
            print_svg +

            '</svg>';


        // Submit the <FORM> to the server.
        // The result will be an attachment file to download.
        var form = document.getElementById("svgform");
        // form['output_format'].value = output_format;
        //form['data'].value = svg_xml ;

        form[0].value = "svg";
        form[1].value = svg_xml;
        this.downloadFile(svg_xml);
    }

    getSampleVarTree( el ) {

        const _self=this;
      
        var str='';
        var num=0;

        if(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].derived)
        {
            //console.log(el);
            str=str + '<tspan x="150" dy="1.2em" font-weight="bold">Name: </tspan> <tspan>' +_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].name
            num++;

            if(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.mapping) {
            
                str =  str + '</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Original Variable: </tspan> <tspan>' +_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].originalIds[0]
                
                + '</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Description: </tspan> <tspan>' + _self.rootStore.dataStore.variableStores.sample.referencedVariables[el].description + 
                '</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Category and Values: </tspan> <tspan>' ;
                
                //+ Object.keys(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.mapping)
               // + ' ' + Object.values(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.mapping)
                //+ '</tspan>';


                var v=  _self.rootStore.dataStore.variableStores.sample.referencedVariables[el];

                var mtype="";

                
                if(v.modification.type){

                    mtype=mtype+ v.modification.type ;
                }
                
                var mtrans="";

                if(v.modification.transformFunction){

                    mtrans=mtrans+  ", " + v.modification.transformFunction.name;
                }



                var keys1=Object.keys(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.mapping)
                var values1=Object.values(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.mapping);

                for(var i=0; i<keys1.length; i++){
                    str = str + keys1[i] + " -> " + values1[i] + ", ";
                }

                if(mtype!==""){

                    str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Data Type: </tspan> <tspan>' + v.datatype + '</tspan> <tspan>';


                    str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Modification Type: </tspan> <tspan>' + mtype + '</tspan> <tspan>';

                }


                if(mtrans!==""){

                    str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Transform Function: </tspan> <tspan>' + mtrans + '</tspan> <tspan>';

                }

              
                str = str + '</tspan> <tspan x="150" dy="1.2em" > --------------------------------------------------------------------------------- </tspan>';

            }
            else {

                if(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.binning) {
                    
                    var binArray=_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.binning.bins;

                    var binStr = '';

                    for(var j=0; j<binArray.length; j++){
                        if(j< (binArray.length-1)){
                            binStr = binStr + binArray[j]  + ' to ' + binArray[j+1] ;
                        }
                        if(j < (binArray.length-2)){
                            binStr = binStr + ', ';
                        }

                    }


                    v=  _self.rootStore.dataStore.variableStores.sample.referencedVariables[el];


                    mtype="";

            
                    if(v.modification.type){
    
                        mtype=mtype+ v.modification.type ;
                    }
                    
                    mtrans="";
    
                    if(v.modification.transformFunction){
    
                        mtrans=mtrans+   v.modification.transformFunction.name;
                    }    

                    
                    
                    str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Description: </tspan> <tspan>' + v.description+ '</tspan> <tspan>';

                    


                    if(mtype!==""){

                        str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Data Type: </tspan> <tspan>' + v.datatype + '</tspan> <tspan>';
    
    
                        str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Modification Type: </tspan> <tspan>' + mtype + '</tspan> <tspan>';
    
                    }
    
    
                    if(mtrans!==""){
    
                        str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Transform Function: </tspan> <tspan>' + mtrans + '</tspan> <tspan>';
    
                    }


                    //str = str +'</tspan> <tspan>: ' +  _self.rootStore.dataStore.variableStores.sample.referencedVariables[el].description + ', ' +
                    str = str +
                    
                    '</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Original Variable: </tspan> <tspan>' +_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].originalIds[0]
                
                    //+'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Description: </tspan> <tspan>' + _self.rootStore.dataStore.variableStores.sample.referencedVariables[el].description 
                    
                    + '</tspan> <tspan  x="150" dy="1.2em" font-weight="bold"> Bins: </tspan>' ;
                    
                    str = str +'<tspan>' 
                     //+ Object.values(_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].modification.binning.bins) 
                     + binStr + '</tspan> <tspan x="150" dy="1.2em" > --------------------------------------------------------------------------------- </tspan>';
                }
                else {
                    //str = str +'</tspan> <tspan>: ' +  _self.rootStore.dataStore.variableStores.sample.referencedVariables[el].description +'</tspan>';


                    v=  _self.rootStore.dataStore.variableStores.sample.referencedVariables[el];

                                    
                    //str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Description: </tspan> <tspan>' + v.description+ '</tspan> <tspan>';

                    str = str + '</tspan> <tspan>';

                    mtype="";

            
                    if(v.modification.type){
    
                        mtype=mtype+ v.modification.type ;
                    }
                    
                    mtrans="";
    
                    if(v.modification.transformFunction){
    
                        mtrans=mtrans+ v.modification.transformFunction.name;
                    }    

                    
                    
                    str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Description: </tspan> <tspan>' + v.description+ '</tspan> <tspan>';

                    


                    if(mtype!==""){

                        str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Data Type: </tspan> <tspan>' + v.datatype + '</tspan> <tspan>';
    
    
                        str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Modification Type: </tspan> <tspan>' + mtype + '</tspan> <tspan>';
    
                    }
    
    
                    if(mtrans!==""){
    
                        str = str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Transform Function: </tspan> <tspan>' + mtrans + '</tspan> <tspan>';
    
                    }


                    str = str + '</tspan> <tspan x="150" dy="1.2em" > --------------------------------------------------------------------------------- </tspan>';
                    var srcVars=_self.rootStore.dataStore.variableStores.sample.referencedVariables[el].originalIds;
                    for(var k=0; k<srcVars.length; k++){
                        let retVal = _self.getSampleVarTree(srcVars[k]);
                        str = str + retVal.string;
                        num = num + retVal.count;
                    }
                }
            }

        } 
        else {
            console.log(str);
            return {'string': str, 'count': num};
        }

        
        return {'string': str, 'count': num};
      }


      getEventVarTree( el ) {

        const _self=this;
      
        var str='';
        var num=0;

        if(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].derived)
        {
            //console.log(el);
            str=str + '<tspan x="150" dy="1.2em" font-weight="bold"> Name: </tspan> <tspan>' +_self.rootStore.dataStore.variableStores.between.referencedVariables[el].name
            num++;

            if(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.mapping) {
            
                //str = str + ', Category: ' + Object.keys(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.mapping)
                //+ ', Values: ' + Object.values(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.mapping)
                //+ '</tspan>';

                str =  str +'</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Description: </tspan> <tspan>' + _self.rootStore.dataStore.variableStores.between.referencedVariables[el].description + 
                '</tspan> <tspan x="150" dy="1.2em" font-weight="bold"> Category and Values: </tspan> <tspan>' ;
                
                var keys1=Object.keys(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.mapping)
                var values1=Object.values(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.mapping);

                for(var i=0; i<keys1.length; i++){
                    str = str + keys1[i] + " -> " + values1[i] + ", ";
                }

                str = str + '</tspan> <tspan x="150" dy="1.2em" > --------------------------------------------------------------------------------- </tspan>';

            }
            else {

                if(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.binning) {
                   
                    var binArray=_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.binning.bins;

                    var binStr = '';

                    for(var j=0; j<binArray.length; j++){
                        if(j< (binArray.length-1)){
                            binStr = binStr + binArray[j]  + ' to ' + binArray[j+1] ;
                        }
                        if(j < (binArray.length-2)){
                            binStr = binStr + ', ';
                        }

                    }

                    str = str + ' Bins: ' 
                    //+ Object.values(_self.rootStore.dataStore.variableStores.between.referencedVariables[el].modification.binning.bins) 
                    + binStr
                    + '</tspan>';
                }
                else {
                    str = str + ': ' + _self.rootStore.dataStore.variableStores.between.referencedVariables[el].description + '</tspan>';
                    var srcVars=_self.rootStore.dataStore.variableStores.between.referencedVariables[el].originalIds;
                    for(var l=0; l<srcVars.length; l++){
                        let retVal = _self.getEventVarTree(srcVars[l]);
                        str = str + retVal.string;
                        num = num + retVal.count;
                    }
                }

            }       

        } 
        else{
            console.log(str);
            return {'string': str, 'count': num};
        }


        
        return {'string': str, 'count': num};
      }

    /**
     * exports current view + metadata
     */
    exportSVGandData() {
        var tmp;
        if (this.rootStore.uiStore.globalTime==='line') {
            tmp = document.getElementById("timeline-view");
        } else {
            tmp = document.getElementById("block-view");
        }
        //var svg_all = tmp.getElementsByTagName("svg");

        var svg_all = Array.from(tmp.getElementsByTagName("svg"));

        svg_all.sort((svg1, svg2) => {
            return svg1.getBoundingClientRect().left-svg2.getBoundingClientRect().left
        });

        var print_svg = '';

        var minW = null, minH = null, maxW = null, maxH = null;

        var prev_right = 0, new_x, new_right;


        for (var i = 0; i < svg_all.length; i++) {
            var t = "";

            var svg_copy = svg_all[i].cloneNode(true);
            var a = svg_copy.getElementsByClassName("not_exported");
            [...a].forEach(t => {
                t.remove();
            })


            for (var c = 0; c < svg_copy.children.length; c++) {
                var temp = svg_copy.children[c];

                t = t + (new XMLSerializer()).serializeToString(temp);
            }

            var boundingRect; // = svg_all[i].parentElement.getBoundingClientRect();

            if (this.rootStore.uiStore.globalTime==='line' && this.rootStore.uiStore.transitionOn && (i === 0 || i === 1)) {
                boundingRect = svg_all[i].getBoundingClientRect();
            }
            else {
                boundingRect = svg_all[i].parentElement.getBoundingClientRect();
            }
            var width = svg_all[i].getBoundingClientRect().width;
            var height = svg_all[i].getBoundingClientRect().height;

            new_x = boundingRect.x;
            new_right = new_x + width;

            if (boundingRect.x < prev_right && this.rootStore.uiStore.globalTime.includes('block')) {

                new_right = prev_right + width;
                new_x = prev_right;
            }

            prev_right = new_right - 1;

            if (minW===null || boundingRect.left < minW) {
                minW = boundingRect.left;
            }
            if (maxW===null || new_right > maxW) {
                maxW = new_right;
            }
            if (minH===null || boundingRect.top < minH) {
                minH = boundingRect.top;
            }
            if (maxH===null || boundingRect.bottom > maxH) {
                maxH = boundingRect.bottom;
            }

            var scaleX = 1;

            if (this.rootStore.uiStore.globalTime==='line' && this.rootStore.dataStore.transitionOn && i === 4) {
                // if(this.rootStore.dataStore.transitionOn && i===4){

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +

                    t +

                    '</g>';

            }
            else if (this.rootStore.uiStore.globalTime==='line' && !this.rootStore.dataStore.transitionOn && i === 3) {

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +

                    t +

                    '</g>';
                //}

            } else {
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ')" >' +
                    //'<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + 10 + ')" >' +
                    t +

                    '</g>';
            }
        }

        var name = this.rootStore.study.name.replace('&', 'and');
        var desc = this.rootStore.study.description.replace('&', 'and');

        const minTP = Math.min(...Object.keys(this.rootStore.sampleStructure).map(key => this.rootStore.sampleStructure[key].length));
        const maxTP = Math.max(...Object.keys(this.rootStore.sampleStructure).map(key => this.rootStore.sampleStructure[key].length));

        const _self=this;

        var str= '';
        var count = 0;

        this.rootStore.dataStore.variableStores.sample.currentVariables.forEach(function(el)
        {
            let retVal = _self.getSampleVarTree(el);
            str= str + retVal.string;
            count = count + retVal.count;
        })

        this.rootStore.dataStore.variableStores.between.currentVariables.forEach(function(el)
        {
            let retVal = _self.getEventVarTree(el);
            str= str + retVal.string;
            count = count + retVal.count;
        })

        
        console.log(str);    

        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date+' '+time;

        console.log(dateTime);

        var space=25;

        var dates_info= '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(10, ' + (maxH).toString() + ')">';

        dates_info = dates_info + '<text style="font-size:20px" font-weight="bold">OncoThreads </text>';

        dates_info = dates_info + '</g>';

        dates_info=  dates_info + '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(10, ' + (space+maxH).toString() + ')">';

        dates_info = dates_info + '<text style="font-size:18px">Date and time: ' + dateTime + '</text>';

        dates_info = dates_info + '</g>';


        

        var svg_prefix =
            '<g width="' + ((minW + maxW) * 2).toString() + '" height= "25" transform="translate(10, ' + (2*space+maxH).toString() + ')">' +
            '<text style="font-size:18px">Study: ' + name + '</text>' +
            '</g>' +
            '<g width="' + ((minW + maxW) * 2).toString() + '" height= "25" transform="translate(10, ' + (3*space+maxH).toString() + ')">' +
            '<text style="font-size:18px">Description: ' + desc + '</text>' +
            '</g>' +
            '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(10, ' + (4*space+maxH).toString() + ')">' +
            '<text style="font-size:18px">Citation: ' + this.rootStore.study.citation + '</text>' +
            '</g>' +
            '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(10, ' + (5*space+maxH).toString() + ')">' +
            '<text style="font-size:18px">Number of patients: ' + this.rootStore.patients.length + '</text>' +
            '</g>' +
            '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(10, ' + (6*space+maxH).toString() + ')">' +
            '<text style="font-size:18px">Number of timepoints: ' + minTP + "-" + maxTP + '</text>' +
            '</g>' 


        var variableMetadata= '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(10, ' + (7*space+maxH).toString() + ')">';
        if(count>0) {
            variableMetadata = variableMetadata + '<text style="font-size:18px">Derived variable(s):' + str + '</text>';

            
        }


        //variableMetadata = variableMetadata + '<text style="font-size:18px">Date and time: ' + dateTime + '</text>';

        variableMetadata = variableMetadata + '</g>';

        var svg_xml = '<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial" width = "' + ((minW + maxW) * 2).toString() + '" height= "' + (minH + maxH + count*20*10+20).toString() + '">' +
            dates_info +
            print_svg +
            svg_prefix +
            variableMetadata  +
            '</svg>';
        
       

        // Submit the <FORM> to the server.
        // The result will be an attachment file to download.
        //var form = document.getElementById("svgform");

        //form[0].value = "svg";
        //form[1].value = svg_xml;
        this.downloadFile(svg_xml);
    }


    exportPNG() {
        var tmp;
        if (this.rootStore.uiStore.globalTime.includes('block')) {
            tmp = document.getElementById("timeline-view");
        } else {
            tmp = document.getElementById("block-view");
        }

        //var tmp2 = '<div>' + tmp.innerHTML + '<div>'

        console.log(tmp);

        html2canvas(tmp, {x:-15, width: tmp.getBoundingClientRect().width+30, height: 1000}).then((canvas) => {
            var element = document.createElement("a");
            element.href = canvas.toDataURL('image/png');
            element.download = "download.png";
            element.click();
        });
    }

    
    exportPDF() {
        var tmp;
        if (this.rootStore.uiStore.globalTime==='line') {
            tmp = document.getElementById("timeline-view");
        } else {
            tmp = document.getElementById("block-view");
        }
        html2canvas(tmp, {x:-15, width: tmp.getBoundingClientRect().width+30, height: 1000}).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            // Multiplying by 1.33 because canvas.toDataURL increases the size of the image by 33%
            const pdf = new jsPDF('l', 'px', [canvas.width*1.33, canvas.height*1.33]);

            /*pdf.text(20, 20, 'This PDF has a title, subject, author, keywords and a creator.');

            // Optional - set properties on the document
            pdf.setProperties({
            title: 'Title',
            subject: 'This is the subject',
            author: 'Author Name',
            keywords: 'generated, javascript, web 2.0, ajax',
            creator: 'Creator Name'
            });*/



            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save("download.pdf"); 
        });
    }
    /**
     * downloads file
     * @param content
     */
    downloadFile(content) {
        var element = document.createElement("a");
        var file = new Blob([content], {type: 'image/svg+xml'});
        element.href = URL.createObjectURL(file);
        element.download = "download.svg";
        //element.target = "_blank";
        element.click();
    }

}

export default SvgExport;