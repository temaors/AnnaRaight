from flask import Flask, request, jsonify, send_from_directory
import time
from config import Config
from database.db_manager import DatabaseManager
from utils.helpers import validate_email, validate_required_fields, sanitize_input
from utils.logger import setup_logger, log_lead_creation, log_appointment_booking, log_error, log_api_request

app = Flask(__name__)
app.config.from_object(Config)

# Initialize database manager
db_manager = DatabaseManager()

# Setup logger
logger = setup_logger()

@app.before_request
def before_request():
    """Log all requests"""
    request.start_time = time.time()

@app.after_request
def after_request(response):
    """Log response and calculate response time"""
    if hasattr(request, 'start_time'):
        response_time = int((time.time() - request.start_time) * 1000)
        log_api_request(request.method, request.path, response.status_code, response_time)
    return response

@app.route('/')
def index():
    """Serve main funnel page"""
    page = request.args.get('page', '1')
    return send_from_directory('templates', 'index.html')

@app.route('/<path:filename>')
def serve_pages(filename):
    """Serve HTML pages"""
    if filename.endswith('.html'):
        return send_from_directory('pages', filename)
    return send_from_directory('.', filename)

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, images, videos)"""
    return send_from_directory('static', filename)

@app.route('/admin/<path:filename>')
def serve_admin(filename):
    """Serve admin files"""
    return send_from_directory('admin', filename)

@app.route('/api/save-lead', methods=['POST'])
def save_lead():
    """API endpoint to save lead"""
    try:
        data = request.get_json()
        
        # Validate required fields
        missing_fields = validate_required_fields(data, 'lead')
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Sanitize input
        first_name = sanitize_input(data.get('firstName', ''))
        email = sanitize_input(data.get('email', ''))
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Save lead to database
        result = db_manager.save_lead(first_name, email)
        
        if result['success']:
            log_lead_creation(email, first_name)
            return jsonify({
                'success': True,
                'message': 'Lead saved successfully',
                'lead_id': result['lead_id']
            }), 200
        else:
            return jsonify({'error': result['error']}), 409
        
    except Exception as e:
        log_error(str(e), 'save_lead')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/save-appointment', methods=['POST'])
def save_appointment():
    """API endpoint to save appointment with Google Calendar integration"""
    try:
        data = request.get_json()
        
        # Validate required fields
        missing_fields = validate_required_fields(data, 'appointment')
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Sanitize input
        sanitized_data = {
            'name': sanitize_input(data.get('name', '')),
            'email': sanitize_input(data.get('email', '')),
            'phone': sanitize_input(data.get('phone', '')),
            'website': sanitize_input(data.get('website', '')),
            'revenue': sanitize_input(data.get('revenue', '')),
            'appointment_date': data.get('appointment_date', '2025-08-23'),
            'appointment_time': data.get('appointment_time', '11:00'),
            'timezone': data.get('timezone', 'Europe/Moscow')
        }
        
        # Validate email format
        if not validate_email(sanitized_data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Save appointment to database and Google Calendar
        result = db_manager.save_appointment(sanitized_data)
        
        if result['success']:
            log_appointment_booking(
                sanitized_data['email'], 
                sanitized_data['appointment_date'], 
                sanitized_data['appointment_time']
            )
            return jsonify({
                'success': True,
                'message': 'Appointment saved successfully',
                'appointment_id': result['appointment_id'],
                'google_event_id': result.get('google_event_id'),
                'google_event_link': result.get('google_event_link'),
                'calendar_message': result.get('calendar_message')
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
        
    except Exception as e:
        log_error(str(e), 'save_appointment')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/available-slots/<date>')
def get_available_slots(date):
    """API endpoint to get available time slots for a specific date"""
    try:
        # Validate date format
        from datetime import datetime
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Get available slots from Google Calendar or default
        available_slots = db_manager.get_available_slots(date)
        
        return jsonify({
            'success': True,
            'date': date,
            'available_slots': available_slots,
            'google_calendar_available': db_manager.calendar_manager.is_google_calendar_available()
        }), 200
        
    except Exception as e:
        log_error(str(e), 'get_available_slots')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/leads')
def get_leads():
    """API endpoint to get all leads"""
    try:
        leads = db_manager.get_leads()
        return jsonify(leads), 200
    except Exception as e:
        log_error(str(e), 'get_leads')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/stats')
def get_stats():
    """API endpoint to get funnel statistics"""
    try:
        stats = db_manager.get_stats()
        return jsonify(stats), 200
    except Exception as e:
        log_error(str(e), 'get_stats')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/update-appointment/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    """API endpoint to update appointment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        missing_fields = validate_required_fields(data, 'appointment')
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Sanitize input
        sanitized_data = {
            'name': sanitize_input(data.get('name', '')),
            'email': sanitize_input(data.get('email', '')),
            'phone': sanitize_input(data.get('phone', '')),
            'website': sanitize_input(data.get('website', '')),
            'revenue': sanitize_input(data.get('revenue', '')),
            'appointment_date': data.get('appointment_date', '2025-08-23'),
            'appointment_time': data.get('appointment_time', '11:00'),
            'timezone': data.get('timezone', 'Europe/Moscow')
        }
        
        # Update appointment
        result = db_manager.update_appointment(appointment_id, sanitized_data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Appointment updated successfully',
                'calendar_result': result.get('calendar_result')
            }), 200
        else:
            return jsonify({'error': result['error']}), 400
        
    except Exception as e:
        log_error(str(e), 'update_appointment')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/delete-appointment/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """API endpoint to delete appointment"""
    try:
        result = db_manager.delete_appointment(appointment_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Appointment deleted successfully',
                'calendar_result': result.get('calendar_result')
            }), 200
        else:
            return jsonify({'error': result['error']}), 400
        
    except Exception as e:
        log_error(str(e), 'delete_appointment')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/send-video-email', methods=['POST'])
def send_video_email():
    """API endpoint to send video email"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('firstName') or not data.get('email'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Sanitize input
        first_name = sanitize_input(data.get('firstName', ''))
        email = sanitize_input(data.get('email', ''))
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Generate video URL (you can customize this)
        video_url = f"http://127.0.0.1:8000/?page=2&firstName={first_name}&email={email}"
        
        # Send email with video
        from utils.email_manager import EmailManager
        email_manager = EmailManager()
        email_manager.send_video_email(email, first_name, video_url)
        
        log_lead_creation(email, first_name, 'video_email_sent')
        
        return jsonify({
            'success': True,
            'message': 'Video email sent successfully'
        }), 200
        
    except Exception as e:
        log_error(str(e), 'send_video_email')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/send-reminders', methods=['POST'])
def send_reminder_emails():
    """API endpoint to send reminder emails for tomorrow's appointments"""
    try:
        result = db_manager.send_reminder_emails()
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': f"Reminder emails sent: {result['reminders_sent']}"
            }), 200
        else:
            return jsonify({'error': result['error']}), 500
        
    except Exception as e:
        log_error(str(e), 'send_reminder_emails')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/admin')
def admin():
    """Admin panel page"""
    try:
        leads = db_manager.get_leads()
        stats = db_manager.get_stats()
        
        html = '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Funnel Admin</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: 600; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center; }
                .stat-number { font-size: 2em; font-weight: bold; color: #2d5a2d; }
                .stat-label { color: #666; margin-top: 5px; }
                .nav { margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                .nav a { margin-right: 20px; color: #3b82f6; text-decoration: none; padding: 8px 16px; border-radius: 4px; }
                .nav a:hover { background: #e0e7ff; }
                h1 { color: #2d5a2d; margin-bottom: 10px; }
                .subtitle { color: #666; margin-bottom: 30px; }
                .google-calendar { background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 5px 0; }
                .email-status { font-size: 12px; color: #666; }
                .email-sent { color: #4caf50; }
                .email-not-sent { color: #f44336; }
                .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
                .status-available { background: #4caf50; }
                .status-unavailable { background: #f44336; }
                .integration-status { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Funnel Admin Panel</h1>
                <p class="subtitle">Управление воронкой продаж и аналитика</p>
                
                <div class="nav">
                    <a href="/">🌐 Воронка</a>
                    <a href="/admin/test-api.html">🧪 Тест API</a>
                    <a href="/admin/test-calendar.html">📅 Тест календаря</a>
                    <a href="/api/stats" target="_blank">📊 API Статистика</a>
                    <a href="/api/send-reminders" target="_blank">📧 Отправить напоминания</a>
                </div>
                
                <div class="integration-status">
                    <h3>🔧 Статус интеграций</h3>
                    <p>
                        <span class="status-indicator ''' + ('status-available' if stats['google_calendar_available'] else 'status-unavailable') + '''"></span>
                        <strong>Google Calendar:</strong> ''' + ('✅ Доступен' if stats['google_calendar_available'] else '❌ Не настроен') + '''
                        ''' + (f'<br><small>Событий в календаре: {stats["google_calendar_appointments"]}' if stats['google_calendar_available'] else '<br><small>Для настройки следуйте инструкциям в admin/google-calendar-setup.md') + '''</small>
                    </p>
                    <p>
                        <span class="status-indicator status-available"></span>
                        <strong>Email уведомления:</strong> ✅ Настроены
                        <br><small>Подтверждения: ''' + ('Включены' if Config.CONFIRMATION_EMAIL_ENABLED else 'Отключены') + ''', Напоминания: ''' + ('Включены' if Config.REMINDER_EMAIL_ENABLED else 'Отключены') + '''</small>
                    </p>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">''' + str(stats['total_leads']) + '''</div>
                        <div class="stat-label">Всего лидов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">''' + str(stats['total_appointments']) + '''</div>
                        <div class="stat-label">Записанных встреч</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">''' + str(stats['today_leads']) + '''</div>
                        <div class="stat-label">Лидов сегодня</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">''' + str(stats['google_calendar_appointments']) + '''</div>
                        <div class="stat-label">В Google Calendar</div>
                    </div>
                </div>
                
                <h2>📋 Все лиды</h2>
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Телефон</th>
                        <th>Сайт</th>
                        <th>Доход</th>
                        <th>Дата встречи</th>
                        <th>Время встречи</th>
                        <th>Статус</th>
                        <th>Google Calendar</th>
                        <th>Email статус</th>
                        <th>Создан</th>
                    </tr>
        '''
        
        for lead in leads:
            google_calendar_status = "✅" if lead['google_event_id'] else "❌"
            confirmation_status = "✅" if lead['confirmation_sent'] else "❌"
            reminder_status = "✅" if lead['reminder_sent'] else "❌"
            
            html += f'''
                    <tr>
                        <td>{lead['id']}</td>
                        <td>{lead['first_name']}</td>
                        <td>{lead['email']}</td>
                        <td>{lead['phone'] or '-'}</td>
                        <td>{lead['website'] or '-'}</td>
                        <td>{lead['revenue'] or '-'}</td>
                        <td>{lead['appointment_date'] or '-'}</td>
                        <td>{lead['appointment_time'] or '-'}</td>
                        <td>{lead['status'] or '-'}</td>
                        <td class="google-calendar">{google_calendar_status}</td>
                        <td>
                            <div class="email-status">
                                <div class="{'email-sent' if lead['confirmation_sent'] else 'email-not-sent'}">
                                    Подтверждение: {confirmation_status}
                                </div>
                                <div class="{'email-sent' if lead['reminder_sent'] else 'email-not-sent'}">
                                    Напоминание: {reminder_status}
                                </div>
                            </div>
                        </td>
                        <td>{lead['created_at']}</td>
                    </tr>
            '''
        
        html += '''
                </table>
            </div>
        </body>
        </html>
        '''
        
        return html
        
    except Exception as e:
        log_error(str(e), 'admin_panel')
        return f"Error loading admin panel: {str(e)}", 500

if __name__ == '__main__':
    logger.info("Starting Funnel application...")
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=8000) 