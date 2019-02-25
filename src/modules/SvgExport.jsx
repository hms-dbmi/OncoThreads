/**
 * class for handling svg export
 * TODO: tidy up
 */
class SvgExport {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.exportSVG = this.exportSVG.bind(this);
        this.exportSVGandData = this.exportSVGandData.bind(this);
    }

    /**
     * exports current view
     */
    exportSVG() {
        var tmp;
        if (this.rootStore.dataStore.globalTime) {
            tmp = document.getElementById("timeline-view");
        } else {
            tmp = document.getElementById("block-view");
        }
        var svg_all = tmp.getElementsByTagName("svg");

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

            if (this.rootStore.dataStore.globalTime && this.rootStore.dataStore.transitionOn && (i === 0 || i === 1)) {
                boundingRect = svg_all[i].getBoundingClientRect();
            }
            else {
                boundingRect = svg_all[i].parentElement.getBoundingClientRect();
            }
            var width = svg_all[i].getBoundingClientRect().width;
            var height = svg_all[i].getBoundingClientRect().height;

            new_x = boundingRect.x;
            new_right = new_x + width;

            if (boundingRect.x < prev_right && !this.rootStore.dataStore.globalTime) {

                new_right = prev_right + width;
                new_x = prev_right;
            }

            prev_right = new_right - 1;

            if (minW == null || boundingRect.left < minW) {
                minW = boundingRect.left;
            }
            if (maxW == null || new_right > maxW) {
                maxW = new_right;
            }
            if (minH == null || boundingRect.top > minH) {
                minH = boundingRect.top;
            }
            if (maxH == null || boundingRect.bottom > maxH) {
                maxH = boundingRect.bottom;
            }

            var scaleX = 1;

            if (this.rootStore.dataStore.globalTime && this.rootStore.dataStore.transitionOn && i === 4) {
                // if(this.rootStore.dataStore.transitionOn && i===4){

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +

                    t +

                    '</g>';

            }
            else if (this.rootStore.dataStore.globalTime && !this.rootStore.dataStore.transitionOn && i === 3) {

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +

                    t +

                    '</g>';
                //}

            } else {
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ')" >' +

                    t +

                    '</g>';
            }
        }

        /*var svg_prefix =
        '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 25)">' +
            '<text style="font-size:18px">Study: ' + this.study.name + '</text>'+
        '</g>' +
        '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 50)">' +
            '<text style="font-size:18px">Description: ' + this.study.description + '</text>'+
        '</g>' +
        '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 75)">' +
            '<text style="font-size:18px">Citation: ' + this.study.citation + '</text>'+
        '</g>' +
        '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 100)">' +
            '<text style="font-size:18px">Number of patients: ' + this.patients.length + '</text>'+
        '</g>' +
        '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 125)">' +
            '<text style="font-size:18px">Number of timepoints: ' + this.minTP + "-" + this.maxTP + '</text>'+
        '</g>'*/

        var svg_xml = '<svg xmlns="http://www.w3.org/2000/svg" width = "' + (minW + maxW).toString() + '" height= "' + (minH + maxH).toString() + '">' +

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

    /**
     * exports current view + metadata
     */
    exportSVGandData() {
        var tmp;
        if (this.rootStore.dataStore.globalTime) {
            tmp = document.getElementById("timeline-view");
        } else {
            tmp = document.getElementById("block-view");
        }
        var svg_all = tmp.getElementsByTagName("svg");

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

                //if(!this.rootStore.dataStore.globalTime){

                /*if(i===0 ){

                    if(temp.childElementCount===2){
                        temp.children[1].remove();
                    }

                }
                else if(i===1 && temp.childElementCount===4){
                    for(var k=0; k<temp.childElementCount; k++){

                        for(var l=0; l< temp.children[k].childElementCount; l++){

                            temp.children[k].children[l].children.sort.remove();
                            if(temp.children[k].children[l].children.group){
                                temp.children[k].children[l].children.group.remove();
                            }
                            if(temp.children[k].children[l].children.ungroup){
                                temp.children[k].children[l].children.ungroup.remove();
                            }

                            temp.children[k].children[l].children.delete.remove();

                        }

                    }
                } */

                //var a = svg_all[i].getElementsByClassName("not_exported");
                //[...a].forEach(t => {t.remove();})

                //}
                /* else{ //global timeline

                     if(i===0){
                         for(var k2=0; k2<svg_all[0].children[0].childElementCount; k2++){
                             svg_all[i].children[0].children[k2].children[0].children[1].remove();
                         }
                     }


                 } */

                t = t + (new XMLSerializer()).serializeToString(temp);
            }

            var boundingRect; // = svg_all[i].parentElement.getBoundingClientRect();

            if (this.rootStore.dataStore.globalTime && this.rootStore.dataStore.transitionOn && (i === 0 || i === 1)) {
                boundingRect = svg_all[i].getBoundingClientRect();
            }
            else {
                boundingRect = svg_all[i].parentElement.getBoundingClientRect();
            }
            var width = svg_all[i].getBoundingClientRect().width;
            var height = svg_all[i].getBoundingClientRect().height;

            new_x = boundingRect.x;
            new_right = new_x + width;

            if (boundingRect.x < prev_right && !this.rootStore.dataStore.globalTime) {

                new_right = prev_right + width;
                new_x = prev_right;
            }

            prev_right = new_right - 1;

            if (minW == null || boundingRect.left < minW) {
                minW = boundingRect.left;
            }
            if (maxW == null || new_right > maxW) {
                maxW = new_right;
            }
            if (minH == null || boundingRect.top > minH) {
                minH = boundingRect.top;
            }
            if (maxH == null || boundingRect.bottom > maxH) {
                maxH = boundingRect.bottom;
            }

            var scaleX = 1;

            if (this.rootStore.dataStore.globalTime && this.rootStore.dataStore.transitionOn && i === 4) {
                // if(this.rootStore.dataStore.transitionOn && i===4){

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +

                    t +

                    '</g>';

            }
            else if (this.rootStore.dataStore.globalTime && !this.rootStore.dataStore.transitionOn && i === 3) {

                scaleX = svg_all[i + 1].getBoundingClientRect().width / width;
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ') scale(' + scaleX + ', 1)" >' +

                    t +

                    '</g>';
                //}

            } else {
                print_svg = print_svg +
                    '<g width="' + width + '" height= "' + height + '" transform="translate(' + new_x + ',' + (boundingRect.y) + ')" >' +

                    t +

                    '</g>';
            }
        }

        var name = this.study.name.replace('&', 'and');
        var desc = this.study.description.replace('&', 'and');

        var svg_prefix =
            '<g width="' + ((minW + maxW) * 2).toString() + '" height= "25" transform="translate(400, 25)">' +
            '<text style="font-size:18px">Study: ' + name + '</text>' +
            '</g>' +
            '<g width="' + ((minW + maxW) * 2).toString() + '" height= "25" transform="translate(400, 50)">' +
            '<text style="font-size:18px">Description: ' + desc + '</text>' +
            '</g>' +
            '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 75)">' +
            '<text style="font-size:18px">Citation: ' + this.study.citation + '</text>' +
            '</g>' +
            '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 100)">' +
            '<text style="font-size:18px">Number of patients: ' + this.patients.length + '</text>' +
            '</g>' +
            '<g width="' + (minW + maxW).toString() + '" height= "25" transform="translate(400, 125)">' +
            '<text style="font-size:18px">Number of timepoints: ' + this.minTP + "-" + this.maxTP + '</text>' +
            '</g>'

        var svg_xml = '<svg xmlns="http://www.w3.org/2000/svg" width = "' + ((minW + maxW) * 2).toString() + '" height= "' + (minH + maxH).toString() + '">' +

            svg_prefix +
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