import React, {useEffect, useRef, useState} from 'react'
import './Checkout.css'
import Confirmation from '../confirmation/Confirmation'

// import useCartFetch from '../../../shared/logic/useCartFetch';
import {Link, useHistory} from 'react-router-dom'
import Form from '../../../shared/UI/Form'
import useForm from '../../../shared/logic/useForm'
import firebase from '../../../firebase'
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles({
  table: {
    minWidth: 700,
  },
  small: {
      maxWidth: 100,
  },
  table: {
    minWidth: 700,
  },
  card: {
      width: "100%",
      marginTop: "2rem",
      padding: "1rem",
  },
  summaryTitle: {
      textAlign: "left",
      marginLeft: "2rem",
      marginTop: "2rem"  
  },
  heading: {
      textDecoration: "underline" 
  },
  button: {
      margin: "2rem 0"
  }
});

const TAX_RATE = 0.07;

function ccyFormat(num) {
  return `${num.toFixed(2)}`;
}

function priceRow(qty, unit) {
  return qty * unit;
}

function createRow(desc, qty, unit) {
  const price = priceRow(qty, unit);
  return { desc, qty, unit, price };
}

function subtotal(items) {
  return items.map(({ price }) => price).reduce((sum, i) => sum + i, 0);
}

const rows = [
  createRow('Paperclips (Box)', 100, 1.15),
  createRow('Paper (Case)', 10, 45.99),
  createRow('Waste Basket', 2, 17.99),
];

const invoiceSubtotal = subtotal(rows);
const invoiceTaxes = TAX_RATE * invoiceSubtotal;
const invoiceTotal = invoiceTaxes + invoiceSubtotal;


const Checkout = (props) => {

    /* -------------- PROPS, STATES, INIT DATA ------------------------- */
    const cart = props.cart;
    const [contents, setContents] = useState({});
    // useCartFetch(cart.state, contents, setContents);
    const [ totalItem, totalPrice ] = cart.getCartDetails();
    const cartItems = Object.entries(cart.state);
    const [submitted, setSubmitted] = useState(false);
    const ref = firebase.firestore().collection("data")
    const orders = firebase.firestore().collection("orders")
    const classes = useStyles();
    const history = useHistory();

    useEffect(() => {
        ref.onSnapshot((querySnapshot) => {
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push(doc.data())
            });

            setContents(items);
        })
    }, [cart])

    const checkoutFormFields = [
        {fieldName: 'name', tag: 'input', type: 'text', placeholder: "Name", validationType: "string"},
        {fieldName: 'email', tag: 'input', type: 'text', placeholder: "Email address", validationType: "email"},
        {fieldName: 'store', tag: 'select', options: ['store1', 'store2', 'store3', 'store4', 'store5'], placeholder: "Select a store", validationType: "select"},
        {fieldName: 'card', tag: 'input', type: 'tel', placeholder: "Payment card", validationType: "number"}
    ];

    const checkoutKeyUrl = '/api/checkoutkey';

    const [checkoutFormState, updateCheckoutFormState, inputLengthCheck, setCheckoutFormState] = useForm(checkoutFormFields, checkoutKeyUrl);
    
    /* --------------- POSTS CHECKOUT FORM DATA ----------------------- */
    const postCheckoutFormData = async() => {
        const {name, email, store, card} = checkoutFormState;
        
        if(Object.entries(checkoutFormState).every(item => item[1].validationError === false && item[1].value.length)){
            // orders.add({
            //     name: name.value,
            //     email: email.value,
            //     store: store.value,
            //     card: card.value
            // }).then((docRef) => {
            //     props.dispatch({type: "resetCart"});
            //     history.push({pathname: '/confirmation', state: {name, email, store}})
            // })
            props.dispatch({type: "resetCart"});
            history.push('/confirmation', {name: name.value, email: email.value, store: store.value})
        } else {
            let newState = Object.entries(checkoutFormState).reduce((obj, state) => {
                if(!state[1].value.length) {
                    obj[state[0]] = {...checkoutFormState[state[0]], validationError: true, errorMessage: "This field is required", errorType: "length"};
                } else {
                    obj[state[0]] = {...checkoutFormState[state[0]]};
                }
                return obj
            }, {})
            setCheckoutFormState(newState);
        }
    }

    /* ------------------ PRESENTATION LOGIC ------------------------- */

    if (!cartItems.length || !contents.length) {
        return <div style={{textAlign: "center", fontSize: "1.3em"}}>This page is currently not available</div>
    } else if(!submitted) { 

        const [ totalItem, totalPrice ] = cart.getCartDetails();

    /* ----------------------- UI ------------------------------------ */
        return(
            <React.Fragment>
                <div className="cart-info">
                    <div className="cart-summary">
                        <Card>
                        <Typography className={`${classes.summaryTitle} ${classes.heading}`} gutterBottom variant="h5" component="h2">
                                Order summary
                            </Typography>
                        <TableContainer component={Paper}>

                            <Table aria-placeholder="spanning table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" colSpan={3}>
                                        Details
                                        </TableCell>
                                        <TableCell align="right">Price</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Desc</TableCell>
                                        <TableCell align="right">Qty.</TableCell>
                                        <TableCell align="right">Unit</TableCell>
                                        <TableCell align="right">Sum</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                {cartItems.map((item) => {
                                    let content = contents.find(el => el.id === item[0])
                                    return (<TableRow key={content.id}>
                                        <TableCell><img src={content.ImageFile} className={classes.small}></img></TableCell>
                                        <TableCell align="right">{item[1].quantity}</TableCell>
                                        <TableCell align="right">{content.unit}</TableCell>
                                        <TableCell align="right">{content.price}</TableCell>
                                    </TableRow>)
                                })}

                                    <TableRow>
                                        <TableCell rowSpan={3} />
                                        <TableCell colSpan={2}>Subtotal</TableCell>
                                        <TableCell align="right">{totalPrice / 1.25} DKK</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Tax</TableCell>
                                        <TableCell align="right">{`25 %`}</TableCell>
                                        <TableCell align="right">{totalPrice * 0.25} DKK</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>Total</TableCell>
                                        <TableCell align="right">{totalPrice} DKK</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </Card>
                    </div>
                </div>
                <div className="checkout-form">
                    <Card className={classes.card}>
                        <CardContent>
                            <Typography className={classes.heading} gutterBottom variant="h5" component="h2">
                                Order details 
                            </Typography>
                            <Form 
                                formFields={checkoutFormFields}
                                formState={checkoutFormState}
                                updateFormState={updateCheckoutFormState}
                                inputLengthCheck={inputLengthCheck}
                            />
                        </CardContent>
                    </Card>

                </div>
                <div className="checkout-nav">
                    <Link to="/cart" style={{ textDecoration: 'none' }}>
                        <Button variant="contained" className={classes.button}>BACK TO CART</Button>
                    </Link>
                    <Button variant="contained"
                            className={classes.button}
                            onClick={() => postCheckoutFormData()}>PAY
                    </Button>
                </div>
            </React.Fragment>
        )
    } else {
        return(
            <Confirmation
                name={checkoutFormState.name}
                store={checkoutFormState.store}
            /> 
        )
    }
}

export default Checkout