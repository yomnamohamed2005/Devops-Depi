import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WebSocketService, DashboardStats } from '../../services/websocket.service';
import { SensorService, SensorData } from '../../services/sensor.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  private statsSubscription?: Subscription;
  
  reports = [
    { 
      title: 'Sensor Performance Report', 
      period: 'Last 30 Days',
      value: '98.5%',
      trend: '+2.3%',
      icon: '📊',
      color: '#0A4D68'
    },
    { 
      title: 'Data Collection Report', 
      period: 'Last 7 Days',
      value: '87,234',
      trend: '+12%',
      icon: '📈',
      color: '#088395'
    },
    { 
      title: 'System Uptime', 
      period: 'This Month',
      value: '99.8%',
      trend: '+0.1%',
      icon: '🟢',
      color: '#16C47F'
    },
    { 
      title: 'Error Rate', 
      period: 'Last 24 Hours',
      value: '0.2%',
      trend: '-0.5%',
      icon: '⚠️',
      color: '#DB3A34'
    },
    {
      title: 'Active Sensors',
      period: 'Currently',
      value: '138/142',
      trend: '+3',
      icon: '📡',
      color: '#05BFDB'
    },
    {
      title: 'Avg Response Time',
      period: 'Last Hour',
      value: '45ms',
      trend: '-5ms',
      icon: '⚡',
      color: '#088395'
    }
  ];

  sensorReports: SensorData[] = [];
  chartData: any = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [120, 190, 300, 250, 280, 320, 350]
  };

  temperatureChartData: any = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    values: [22.5, 21.8, 23.2, 25.5, 26.1, 24.8, 23.0]
  };

  get maxChartValue(): number {
    return Math.max(...this.chartData.values, 1);
  }

  get maxTemperatureValue(): number {
    return Math.max(...this.temperatureChartData.values, 1);
  }

  getBarHeight(value: number): string {
    const height = (value / this.maxChartValue) * 100;
    return `${height}%`;
  }

  getTemperatureHeight(value: number): string {
    const max = this.maxTemperatureValue;
    const min = Math.min(...this.temperatureChartData.values);
    const range = max - min;
    const normalized = ((value - min) / range) * 100;
    return `${normalized}%`;
  }

  isEven(index: number): boolean {
    return index % 2 === 0;
  }

  isPositiveTrend(trend: string): boolean {
    return trend.startsWith('+');
  }

  getTrendArrow(trend: string): string {
    return trend.startsWith('+') ? '↗' : '↘';
  }

  selectedPeriod: string = '7d';
  periods = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 3 Months', value: '3m' },
    { label: 'Last Year', value: '1y' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private websocketService: WebSocketService,
    private sensorService: SensorService
  ) {}

  ngOnInit(): void {
    // Use static user (no login required)
    this.currentUser = { username: 'admin', name: 'Admin User' };

    // Load static data immediately
    this.loadStaticReports();
    this.loadSensorData();
    this.loadReports();
  }

  private loadStaticReports(): void {
    this.sensorReports = [
      { sensorId: 'sensor001', sensorType: 'temperature', value: 25.5, timestamp: new Date().toISOString(), location: 'Building A' },
      { sensorId: 'sensor002', sensorType: 'humidity', value: 60.2, timestamp: new Date().toISOString(), location: 'Building B' },
      { sensorId: 'sensor003', sensorType: 'pressure', value: 1013.25, timestamp: new Date().toISOString(), location: 'Building C' },
      { sensorId: 'sensor004', sensorType: 'temperature', value: 23.8, timestamp: new Date().toISOString(), location: 'Building A' },
      { sensorId: 'sensor005', sensorType: 'humidity', value: 58.5, timestamp: new Date().toISOString(), location: 'Building B' },
      { sensorId: 'sensor006', sensorType: 'light', value: 450, timestamp: new Date().toISOString(), location: 'Building C' },
      { sensorId: 'sensor007', sensorType: 'motion', value: 1, timestamp: new Date().toISOString(), location: 'Building A' }
    ];
    this.updateChartData();
  }

  ngOnDestroy(): void {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

  loadSensorData(): void {
    this.sensorService.getSensorData().subscribe({
      next: (data) => {
        this.sensorReports = data || [];
        this.updateChartData();
      },
      error: () => {
        // Use mock data if API fails
        this.sensorReports = this.getMockSensorData();
        this.updateChartData();
      }
    });
  }

  loadReports(): void {
    this.statsSubscription = this.websocketService.stats$.subscribe(
      (stats: DashboardStats) => {
        this.updateReportsFromStats(stats);
      }
    );
  }

  updateReportsFromStats(stats: DashboardStats): void {
    if (stats.sensorData && stats.sensorData.length > 0) {
      this.reports[0].value = `${((stats.sensorData.length / 100) * 100).toFixed(1)}%`;
      this.reports[1].value = stats.sensorData.length.toLocaleString();
    }
  }

  updateChartData(): void {
    // Update chart data based on sensor reports
    if (this.sensorReports.length > 0) {
      const values = this.sensorReports.slice(0, 7).map(s => s.value || 0);
      this.chartData.values = values;
    }
  }

  getMockSensorData(): SensorData[] {
    return [
      { sensorId: 'sensor001', sensorType: 'temperature', value: 25.5, timestamp: new Date().toISOString(), location: 'Building A' },
      { sensorId: 'sensor002', sensorType: 'humidity', value: 60.2, timestamp: new Date().toISOString(), location: 'Building B' },
      { sensorId: 'sensor003', sensorType: 'pressure', value: 1013.25, timestamp: new Date().toISOString(), location: 'Building C' },
      { sensorId: 'sensor004', sensorType: 'temperature', value: 23.8, timestamp: new Date().toISOString(), location: 'Building A' },
      { sensorId: 'sensor005', sensorType: 'humidity', value: 58.5, timestamp: new Date().toISOString(), location: 'Building B' }
    ];
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadSensorData();
  }

  showExportMenu = false;
  exportLoading = false;

  toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  closeExportMenu(): void {
    this.showExportMenu = false;
  }

  exportReport(format: 'pdf' | 'excel' | 'json'): void {
    this.exportLoading = true;
    this.showExportMenu = false;

    const reportData = {
      reports: this.reports,
      sensorData: this.sensorReports,
      chartData: this.chartData,
      period: this.selectedPeriod,
      generatedAt: new Date().toISOString(),
      generatedBy: this.currentUser?.name || this.currentUser?.username || 'System'
    };

    try {
      switch (format) {
        case 'pdf':
          this.exportAsPDF(reportData);
          break;
        case 'excel':
          this.sensorService.exportReportAsExcel(reportData, this.selectedPeriod);
          this.exportLoading = false;
          break;
        case 'json':
          this.sensorService.exportReportAsJSON(reportData, this.selectedPeriod);
          this.exportLoading = false;
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      this.exportLoading = false;
    }
  }

  private exportAsPDF(reportData: any): void {
    if (environment.enableApi) {
      this.sensorService.exportReportAsPDF(reportData, this.selectedPeriod).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `report-${this.selectedPeriod}-${Date.now()}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.exportLoading = false;
        },
        error: (error) => {
          console.error('PDF export failed, using client-side fallback:', error);
          this.exportAsPDFClientSide(reportData);
        }
      });
    } else {
      // Client-side PDF generation fallback
      this.exportAsPDFClientSide(reportData);
    }
  }

  private exportAsPDFClientSide(reportData: any): void {
    // Simple HTML to PDF conversion using window.print()
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = this.generatePDFHTML(reportData);
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      this.exportLoading = false;
    } else {
      console.error('Failed to open print window');
      this.exportLoading = false;
    }
  }

  private generatePDFHTML(data: any): string {
    const periodLabel = this.periods.find(p => p.value === this.selectedPeriod)?.label || this.selectedPeriod;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sensor Report - ${periodLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #667eea; }
          h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #667eea; color: white; }
          .report-card { margin: 20px 0; padding: 15px; border-left: 4px solid #667eea; background: #f8f9fa; }
          .meta { color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>📊 Sensor Data Report</h1>
        <p><strong>Period:</strong> ${periodLabel}</p>
        <p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
        <p><strong>Generated By:</strong> ${data.generatedBy}</p>
        
        <h2>Summary Reports</h2>
        ${data.reports.map((r: any) => `
          <div class="report-card">
            <h3>${r.title}</h3>
            <p><strong>Period:</strong> ${r.period}</p>
            <p><strong>Value:</strong> ${r.value}</p>
            <p><strong>Trend:</strong> ${r.trend}</p>
          </div>
        `).join('')}
        
        <h2>Sensor Data</h2>
        <table>
          <thead>
            <tr>
              <th>Sensor ID</th>
              <th>Type</th>
              <th>Value</th>
              <th>Location</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${data.sensorData.map((s: any) => `
              <tr>
                <td>${s.sensorId || 'N/A'}</td>
                <td>${s.sensorType || 'Unknown'}</td>
                <td>${s.value || 0}</td>
                <td>${s.location || 'N/A'}</td>
                <td>${s.timestamp ? new Date(s.timestamp).toLocaleString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="meta">
          <p>Report generated by Smart City Operations Dashboard</p>
        </div>
      </body>
      </html>
    `;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }

  getBarColor(index: number): string {
    const colors = [
      'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(180deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(180deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(180deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(180deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(180deg, #a8edea 0%, #fed6e3 100%)'
    ];
    return colors[index % colors.length];
  }

  getSensorTypeColor(type: string | undefined): string {
    const colors: { [key: string]: string } = {
      'temperature': '#f5576c',
      'humidity': '#4facfe',
      'pressure': '#43e97b',
      'light': '#fee140',
      'motion': '#fa709a'
    };
    return colors[type || ''] || '#667eea';
  }

  formatTimestamp(timestamp: string | undefined): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTemperatureLinePoints(): string {
    const values = this.temperatureChartData.values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const points: string[] = [];
    
    values.forEach((value: number, index: number) => {
      const x = (index * 100) + 50;
      const y = 200 - ((value - min) / range * 150);
      points.push(`${x},${y}`);
    });
    
    return points.join(' ');
  }

  getTemperatureMin(): number {
    return Math.min(...this.temperatureChartData.values);
  }

  getTemperatureMax(): number {
    return Math.max(...this.temperatureChartData.values);
  }

  getTemperatureRange(): number {
    return this.getTemperatureMax() - this.getTemperatureMin();
  }

  getTemperatureY(value: number, index: number): number {
    const min = this.getTemperatureMin();
    const range = this.getTemperatureRange();
    return 200 - ((value - min) / range * 150);
  }

  getTemperatureX(index: number): number {
    return (index * 100) + 50;
  }
}
