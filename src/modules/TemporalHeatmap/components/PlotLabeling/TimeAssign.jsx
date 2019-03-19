import React from "react";
import {observer,inject} from "mobx-react";
import {ButtonToolbar, DropdownButton, MenuItem} from 'react-bootstrap';


/*
 * Select element for selecting the current time scale
 * TODO: maybe we don't need a separate class for this, integrate somewhere else?
 */
const TimeAssign = inject("rootStore")(observer(class TimeAssign extends React.Component {

    /*constructor(props){
        super(props)
        this.state = {
          listOpen: false,
          headerTitle: this.props.title,

          list: [
            {
                id: 0,
                title: 'Days',
                selected: false,
                key: 'location'
            },
            {
              id: 1,
              title: 'Months',
              selected: false,
              key: 'location'
            },
            {
              id: 2,
              title: 'Year',
              selected: false,
              key: 'location'
            }
          ]
        }


    }  

    handleClickOutside(){
        this.setState({
          listOpen: false
        })
      }
      toggleList(){
        this.setState(prevState => ({
          listOpen: !prevState.listOpen
        }))
      }
*/


    constructor() {
        super();

        this.state = {
            showMenu: false

        };


        /* extendObservable(this, {
             timeVar: this.props.timeVar,
             timeValue: this.props.timeValue
             //timeline: []
         });*/


        this.showMenu = this.showMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);

    }

    showMenu(event) {
        event.preventDefault();

        this.setState({showMenu: true}, () => {
            document.addEventListener('click', this.closeMenu);
        });
    }

    closeMenu(event) {
        console.log(event.target);
        //if (!this.dropdownMenu.contains(event.target)) {

        this.setState({showMenu: false}, () => {
            document.removeEventListener('click', this.closeMenu);
        });

        //}
    }


    /*handleClick(e) {
        e.preventDefault();
        //console.log(e.target.id);
        this.props.rootStore.timeVar=e.target.id;
        this.props.rootStore.timeValue=e.target.value;
      }*/


    handleClick2(id, value) {
        //e.preventDefault();
        //console.log(e.target.id);
        this.props.rootStore.setTimeData(id,value)
    }


    render() {



        //const list = this.state.list;
        //const{listOpen, headerTitle} = this.state;       

        /*return (
            <div>

        <div>

        
            <button onClick={this.showMenu} >
            Show time as..
            </button>
            
            {
            this.state.showMenu
                ? (
                <div
                    className="menu"
                    ref={(element) => {
                    this.dropdownMenu = element;
                    }}
                >
                    <button id="1" value="days" onClick={e => this.handleClick(e)} > Days </button>
                    <button id="30" value="months" onClick={e => this.handleClick(e)} > Months </button>
                    <button id="365" value="years" onClick={e => this.handleClick(e)} > Years </button>
                </div>
                )
                : (
                null
                )
            }



        </div>



      
            </div>
        ); */


        return (


            <div>

                <ButtonToolbar>


                    <DropdownButton

                        bsSize="xsmall"

                        title={"Show Time As"}
                        key={"ShowTime"}
                        id={"ShowTime"}
                    >

                        <MenuItem eventKey="1" onClick={e => this.handleClick2("1", "days")}>
                            <small> Days</small>
                        </MenuItem>
                        <MenuItem eventKey="2" onClick={e => this.handleClick2("30", "months")}>
                            <small> Months</small>
                        </MenuItem>
                        <MenuItem eventKey="3" onClick={e => this.handleClick2("365", "years")}>
                            <small> Years</small>
                        </MenuItem>
                    </DropdownButton>
                </ButtonToolbar>

            </div>

        );
    }
}));
export default TimeAssign;

//<tspan x="39" dy="1em">(months)</tspan>
/*  <select className="dropdown">
                        <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            Dropdown button
                        </button>
                        <select className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                            <button>Month </button>
                            <button>Days </button>
                        </select>
                    </select>




                    <select className="dropdown">
                        
                            
                                <option>Month </option>
                                <option>Days </option>
                        
                        </select>
*/

/*


//in render

    const list = this.state.list;
        const{listOpen, headerTitle} = this.state;
//in return

            <div className="dd-wrapper">
            <div className="dd-header" onClick={() => this.toggleList()}>
                <div className="dd-header-title">{headerTitle}</div>
                {listOpen
                ? <FontAwesome name="angle-up" size="0.5x"/>
                : <FontAwesome name="angle-down" size="0.5x"/>
                }
            </div>
            {listOpen && <ul className="dd-list">
            {this.state.list.map((item) => (
                <li className="dd-list-item" key={item.id} >{item.title} </li>
                ))}
            </ul>}
            </div>



*/