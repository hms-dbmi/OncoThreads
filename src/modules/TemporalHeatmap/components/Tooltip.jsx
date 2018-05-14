import React from 'react';
import {observer} from 'mobx-react';
/*
tooltip for hovering over Sankey Transition
 */
const Tooltip=observer(class SankeyTransitionTooltip extends React.Component{
        /**
     * computes the width of a text. Returns 30 if the text width would be shorter than 30
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(text,fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font=fontSize+"px Arial";
        return context.measureText(text).width;
    }
   render(){
   const textWidth=Tooltip.getTextWidth(this.props.content,14);
   let transformText="translate(5,15)";
       return(
            <div className="customTooltip" style={{visibility:this.props.visibility, position:"absolute", top:this.props.y-30, left:this.props.x-textWidth/2}}>
                <svg width={textWidth+10} height="25">
                    <polygon points={(((textWidth+10)/2)-5)+",20 "+ (((textWidth+10)/2)+5)+",20 "+ ((textWidth+10)/2)+",25"} fill="gray" />
                    <rect width={textWidth+10} height="20" fill="gray"/>
                    <text width={textWidth} height="15" fill={"white"} transform={transformText}>{this.props.content}</text>
                </svg>
                </div>
       )
   }
});
export default Tooltip;