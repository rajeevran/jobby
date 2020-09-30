// module.exports = '<div>\
// <table width="100%" bgcolor="#fff" cellpadding="0" cellspacing="0" border="0">\
//     <tbody>\
//         <tr>\
//             <td width="100%">\
//                 <table style="max-width:580px;width:100%;" cellpadding="0" cellspacing="0" border="0" align="center">\
//                     <tbody>\
//                         <tr>\
//                             <td width="100%" height="5"></td>\
//                         </tr>\
//                         <tr>\
//                             <td align="right" valign="middle" style="font-family: Helvetica, arial, sans-serif; font-size: 10px;color: #999999">\
//                                {{ date }}\
//                             </td>\
//                         </tr>\
//                         <tr>\
//                             <td width="100%" height="5"></td>\
//                         </tr>\
//                     </tbody>\
//                 </table>\
//             </td>\
//         </tr>\
//     </tbody>\
// </table>\
// </div>\
// <div>\
// <table width="100%" bgcolor="#fff" cellpadding="0" cellspacing="0" border="0">\
//     <tbody>\
//         <tr>\
//             <td>\
//                 <table style="max-width:580px;width:100%;" bgcolor="#334259" cellpadding="0" cellspacing="0" border="0" align="center">\
//                     <tbody>\
//                         <tr>\
//                             <td>\
//                                 <table width="100%" cellpadding="0" cellspacing="0" border="0" align="left">\
//                                     <tbody>\
//                                         <tr>\
//                                             <td valign="middle" align="center" style="padding:20px 0;">\
//                                                 <div><img src="{{ site_url }}uploads/logo.png" alt="logo" border="0" style="display:block; border:none; outline:none; text-decoration:none;"></div>\
//                                             </td>\
//                                         </tr>\
//                                     </tbody>\
//                                 </table>\
//                             </td>\
//                         </tr>\
//                     </tbody>\
//                 </table>\
//             </td>\
//         </tr>\
//     </tbody>\
// </table>\
// </div>\
// <div>\
// <table width="100%" bgcolor="#fff" cellpadding="0" cellspacing="0" border="0">\
//     <tbody>\
//         <tr>\
//             <td>\
//                 <table bgcolor="#ffffff" style="width:580px;" align="center" cellspacing="0" cellpadding="0" border="0">\
//                     <tbody>\
//                         <tr>\
//                             <td>\
//                                 <table style="padding:0 15px;width:580px;"  cellspacing="0" cellpadding="0" border="0">\
//                                     <tbody>\
//                                         <tr>\
//                                             <td style="font-family: Helvetica, arial, sans-serif; font-size: 13px; color: #666666; text-align:left;line-height: 24px;">\
//                                                 <p>Hi, {{ name }}</p>\
//                                                 <p>Your order: <b>{{ orderId }}</b> has been {{ orderStatus }} successfully.</p>\
//                                             </td>\
//                                         </tr>\
//                                         <tr>\
//                                             <td width="100%" height="5"></td>\
//                                         </tr>\
//                                         <tr>\
//                                             <td style="font-family: Helvetica, arial, sans-serif; font-size: 13px; color: #666666; text-align:left;line-height: 24px;">\
//                                                 <p>Best regards,</p>\
//                                                 <p>Team Corporate Recycling Reward Bernard Hill</p>\
//                                             </td>\
//                                         </tr>\
//                                         <tr>\
//                                             <td width="100%" height="5"></td>\
//                                         </tr>\
//                                     </tbody>\
//                                 </table>\
//                             </td>\
//                         </tr>\
//                     </tbody>\
//                 </table>\
//             </td>\
//         </tr>\
//     </tbody>\
// </table>\
// </div>\
// <div>\
// <table width="100%" bgcolor="#fff" cellpadding="0" cellspacing="0" border="0">\
//     <tbody>\
//         <tr>\
//             <td width="100%">\
//                 <table style="max-width:580px;width:100%;background: #f6f4f5;width:100%;" cellpadding="0" cellspacing="0" border="0" align="center" class="devicewidth">\
//                     <tbody>\
//                         <tr>\
//                             <td width="100%" height="5"></td>\
//                         </tr>\
//                         <tr>\
//                             <td align="center" valign="middle" style="padding:10px 0;font-family: Helvetica, arial, sans-serif; font-size: 10px;color: #999999">\
//                             Copyright © 2019 Corporate Recycling Reward Bernard Hill. All rights reserved.\
//                             </td>\
//                         </tr>\
//                         <tr>\
//                             <td width="100%" height="5"></td>\
//                         </tr>\
//                     </tbody>\
//                 </table>\
//             </td>\
//         </tr>\
//     </tbody>\
// </table>\
// </div>';
module.exports =
    `<body style="padding: 0;margin: 0;font-family: Arial, Helvetica, sans-serif;">\
        <div style="width:600px;margin:0 auto;background-image: url({{ site_url }}uploads/email_template/top_bg.png);background-repeat: no-repeat;">\
            <div style="text-align: center;"><img style="margin-top: 5%;" src="{{ site_url }}uploads/email_template/logo.png" alt="ezfoodie-logo"></div>\
            <hr style="width: 83%;height: 1px; margin-top: 5%;background-color: #e9e9e9; border: 0; border-top: 1px solid #e9e9e9;">\
        <div style="margin-top: -13px;margin-bottom: 42px; font-size: 14px;">
            <div style="padding:10px; padding-left: 50px;color:#585858; font-weight: 500;">
                <p>Hi {{ name }},</p>
                <p>Thank You for using Ezfoodie! Your order has been {{ orderStatus }}.</p>
                <p>Look forward to serving you.</p>
                <table>
                    <tr style="color:#585858;font-weight: 100;">
                        <th style="font-weight: 500; font-size: 13px; text-align: left;">Order No:</th>
                        <th style="font-weight: 500; font-size: 13px">Restaurant:</th>
                      </tr>
                    <tr>
                        <td style="font-weight: bold;font-size: 15px">{{ orderId }}</td>
                        <td style="font-weight: bold;font-size: 15px">{{ restaurant_name }}</td>
                    </tr>
                </table>
                <table style="width:92%;margin-top:10%; border: none;" cellspacing="0" cellpadding="0">\
                    <tr style="background-color:#e9e9e9;font-weight: 700; height: 45px;">\
                        <th style="font-weight: bold; font-size: 15px;">Item name</th>\
                        <th style="font-weight: bold; font-size: 15px">Quantity</th>\
                        <th style="font-weight: bold; font-size: 15px">Price</th>\
                    </tr>\
                    {{ order_body }}
                    <tr style="border-bottom: 3px solid #e9e9e9;">\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px"></td>\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px; text-align: right;">Cart Subtotal</td>\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px; text-align: right;">$ {{ transactionAmount }}</td>\
                    </tr>\
                    <tr>\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px"></td>\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px; text-align: right;">Taxes</td>\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px; text-align: right;">$ {{ transactionFees }}</td>\
                    </tr>\
                    <tr style="background-color: #f9f9f9;">\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px"></td>\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px; color:#7cb044; text-align: right;">Grand Total:</td>\
                        <td style="padding: 2%;font-weight: bold;font-size: 15px; color:#7cb044; text-align: right;">$ {{ total }}</td>\
                    </tr>\
                </table>\
            </div>\
            
        </div>            
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-image: url({{ site_url }}uploads/email_template/footer_bg.png); height: 100px; text-align: center;">\
            <tbody>\
                <tr>\
                    <td style="text-align: center;">\
                        <img style="padding-left:13px;margin-top: 19px;" src="{{ site_url }}uploads/email_template/facebook.png">\
                        <img style="padding-left: 13px;margin-top: 19px;" src="{{ site_url }}uploads/email_template/instagram.png">\
                    </td>\
                </tr>\
            </tbody>\
        </table>\
    </div>\
</body>`;