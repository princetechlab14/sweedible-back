const EventEmitter = require('events');
const { OrderModel } = require('../models');
const { sendEmails } = require('./mailSending');
const { paymentLinkCreate } = require('./paypalClient');

class OrderService extends EventEmitter {
    constructor() {
        super();
        this.initializeListeners();
    }

    initializeListeners() {
        this.on('orderCreate', (orderData) => {
            setTimeout(() => { console.log(`✅ Order ${orderData.id} processed successfully!`); }, 5000);
        });
    }

    async createOrder(orderData) {
        // console.log('📦 New order received, emitting event...');
        const PaymentLinkDetail = await paymentLinkCreate({ totalAmount: orderData.grand_total });
        await OrderModel.update({ payment_detail: PaymentLinkDetail }, { where: { id: orderData.id } });
        orderData.payment_link = PaymentLinkDetail.status ? PaymentLinkDetail.data.link : '';
        await sendEmails(orderData);
        this.emit('orderCreate', orderData);
    }
}

module.exports = new OrderService();
