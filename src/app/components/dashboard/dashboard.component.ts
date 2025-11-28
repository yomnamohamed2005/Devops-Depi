import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { WebSocketService, DashboardStats } from '../../services/websocket.service';
import { SensorService, SensorData } from '../../services/sensor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  private statsSubscription?: Subscription;
  
  // Smart City Statistics (Mock Data)
  stats = [
    { title: 'Total Sensors', value: '142', icon: '📡', color: '#0A4D68', key: 'totalSensors' },
    { title: 'Active Sensors', value: '138', icon: '🟢', color: '#16C47F', key: 'activeSensors' },
    { title: 'Inactive Sensors', value: '4', icon: '🔴', color: '#DB3A34', key: 'inactiveSensors' },
    { title: 'System Uptime', value: '99.8%', icon: '⚡', color: '#088395', key: 'uptime' },
    { title: 'Avg Temperature', value: '24.5°C', icon: '🌡️', color: '#05BFDB', key: 'avgTemp' },
    { title: 'Avg Humidity', value: '62%', icon: '💧', color: '#05BFDB', key: 'avgHumidity' },
    { title: 'Pollution Level (AQI)', value: '85', icon: '🌫️', color: '#F4C430', key: 'aqi' },
    { title: 'Traffic Congestion', value: '45%', icon: '🚦', color: '#088395', key: 'traffic' },
    { title: 'Weather Alerts', value: '2', icon: '⚠️', color: '#F4C430', key: 'alerts' },
    { title: 'Critical Sensors', value: '3', icon: '🔴', color: '#DB3A34', key: 'critical' },
    { title: 'Data Points Today', value: '12,458', icon: '📊', color: '#0A4D68', key: 'dataPoints' },
    { title: 'Last Update', value: 'Just now', icon: '🔄', color: '#088395', key: 'lastUpdate' }
  ];

  recentActivities = [
    { action: '🌡️ Sensor #42 reported high temperature', time: '2 minutes ago', type: 'sensor' },
    { action: '🚦 Traffic alert: Heavy congestion on Main St', time: '8 minutes ago', type: 'traffic' },
    { action: '📡 New sensor registered: Building C - Floor 3', time: '15 minutes ago', type: 'sensor' },
    { action: '🏭 Pollution threshold exceeded in Zone 2', time: '22 minutes ago', type: 'pollution' },
    { action: '🌧️ Weather alert: Rain expected in 2 hours', time: '1 hour ago', type: 'weather' },
    { action: '⚡ System maintenance completed successfully', time: '2 hours ago', type: 'system' }
  ];

  // Sensor Data Form
  sensorForm: FormGroup;
  showSensorForm = false;
  showCreateDialog = false;
  formSubmitted = false;
  formSuccess = false;
  formError = '';
  sensorTypes = ['temperature', 'humidity', 'pressure', 'pollution', 'traffic', 'light', 'motion', 'air_quality'];
  locations = ['Building A', 'Building B', 'Building C', 'Zone 1', 'Zone 2', 'Main Street', 'Park Area'];

  isConnected: boolean = true;
  lastUpdate: Date = new Date();

  constructor(
    private authService: AuthService,
    private router: Router,
    private websocketService: WebSocketService,
    private sensorService: SensorService,
    private fb: FormBuilder
  ) {
    this.sensorForm = this.fb.group({
      sensorId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
      sensorType: ['', Validators.required],
      value: ['', [Validators.required, Validators.min(-100), Validators.max(1000)]],
      location: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Use static user (no login required)
    this.currentUser = { username: 'admin', name: 'Admin User' };

    // Load static data immediately
    this.loadStaticData();

    // Subscribe to real-time stats updates
    this.statsSubscription = this.websocketService.stats$.subscribe(
      (stats: DashboardStats) => {
        this.updateStats(stats);
        this.lastUpdate = new Date();
      }
    );
  }

  private loadStaticData(): void {
    const staticStats: DashboardStats = {
      users: 1234,
      orders: 567,
      revenue: 12345,
      growth: 23.5,
      activeUsers: 234,
      totalSales: 1567,
      conversionRate: 3.5,
      avgOrderValue: 75.5
    };
    this.updateStats(staticStats);
  }

  ngOnDestroy(): void {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

  private updateStats(stats: DashboardStats): void {
    this.stats.forEach(stat => {
      const value = stats[stat.key as keyof DashboardStats];
      if (value !== undefined && typeof value === 'number') {
        if (stat.key === 'revenue' || stat.key === 'avgOrderValue') {
          stat.value = `$${value.toLocaleString()}`;
        } else if (stat.key === 'growth' || stat.key === 'conversionRate') {
          stat.value = `+${value.toFixed(1)}%`;
        } else {
          stat.value = value.toLocaleString();
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getFormattedTime(): string {
    return this.lastUpdate.toLocaleTimeString();
  }

  // Sensor Data Management
  toggleSensorForm(): void {
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
    this.showSensorForm = false;
    this.resetForm();
  }

  openFormInDialog(): void {
    this.showSensorForm = true;
  }

  resetForm(): void {
    this.sensorForm.reset();
    this.formSubmitted = false;
    this.formSuccess = false;
    this.formError = '';
  }

  onSubmitSensorData(): void {
    this.formSubmitted = true;
    this.formError = '';
    this.formSuccess = false;

    if (this.sensorForm.valid) {
      const sensorData: SensorData = {
        sensorId: this.sensorForm.value.sensorId,
        sensorType: this.sensorForm.value.sensorType,
        value: parseFloat(this.sensorForm.value.value),
        location: this.sensorForm.value.location, // location is optional in backend
        timestamp: new Date().toISOString()
      };

      this.sensorService.sendSensorData(sensorData).subscribe({
        next: (response) => {
          this.formSuccess = true;
          this.formError = '';
          // Refresh sensor data after successful submission
          setTimeout(() => {
            this.resetForm();
            this.showSensorForm = false;
            this.showCreateDialog = false;
          }, 2000);
        },
        error: (error) => {
          console.error('Sensor data submission error:', error);
          this.formError = error.error?.message || error.message || 'Failed to send sensor data. Please check your connection and try again.';
          this.formSuccess = false;
        }
      });
    } else {
      this.formError = 'Please fill all required fields correctly.';
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.sensorForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('pattern')) {
      return 'Invalid format. Use only letters, numbers, hyphens, and underscores.';
    }
    if (field?.hasError('min') || field?.hasError('max')) {
      return `Value must be between -100 and 1000`;
    }
    return '';
  }
}

