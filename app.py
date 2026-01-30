# This script sits on your server and sends the email for you
import smtplib
from flask import Flask, request

app = Flask(__name__)

@app.route('/send-mail', methods=['POST'])
def send_mail():
    name = request.form.get('name')
    user_email = request.form.get('email')
    message = request.form.get('message')
    
    # Logic to send email via SMTP (Gmail, SendGrid, etc.)
    # Your actual email address is hidden here in the server variables
    return "Message Sent Successfully!"
