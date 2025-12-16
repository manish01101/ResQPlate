import React, { useState } from 'react';
import './Contact.css';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa'; // Requires: npm install react-icons

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect this to your backend (Node/Express)
    console.log('Form Submitted:', formData);
    alert("Thank you for reaching out! We will get back to you shortly.");
  };

  return (
    <div className="contact-container">
      {/* Header Section */}
      <div className="contact-header">
        <h1>Get in Touch</h1>
        <p>Have questions about rescuing food, partnering with us, or volunteering? We're here to help.</p>
      </div>

      <div className="contact-content">
        {/* Left Side: Contact Info */}
        <div className="contact-info">
          <h2>Contact Information</h2>
          <p>Fill out the form or contact us directly via these channels.</p>
          
          <div className="info-item">
            <FaPhoneAlt className="icon" />
            <span>+91 98765 43210</span>
          </div>
          <div className="info-item">
            <FaEnvelope className="icon" />
            <span>support@resqplate.com</span>
          </div>
          <div className="info-item">
            <FaMapMarkerAlt className="icon" />
            <span>123 Green Street, Tech City, India</span>
          </div>

          <div className="social-media">
            <h3>Follow Our Journey</h3>
            <div className="social-icons">
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaInstagram /></a>
              <a href="#"><FaLinkedin /></a>
            </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="contact-form-wrapper">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                placeholder="John Doe" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                placeholder="john@example.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">I am interested in...</label>
              <select name="subject" id="subject" value={formData.subject} onChange={handleChange}>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Partnering (Restaurant/NGO)">Partnering (Restaurant/NGO)</option>
                <option value="Volunteering">Volunteering</option>
                <option value="Report a Bug">Report a Bug</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea 
                name="message" 
                id="message" 
                rows="5" 
                placeholder="How can we help you today?" 
                value={formData.message} 
                onChange={handleChange} 
                required 
              ></textarea>
            </div>

            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;