import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SensorData {
  sensorId?: string;
  sensorType?: string;
  value?: number;
  timestamp?: string;
  location?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  sendSensorData(data: SensorData): Observable<SensorData> {
      // Convert Frontend format to Backend format
      
      const backendData = {
        sensor_id: data.sensorId,
        type: data.sensorType || data['type'],
        value: data.value,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      };

    const options = this.authService.getAuthHeadersWithOptions();

    return this.http.post<any>(`${this.apiUrl}/sensor-data`, backendData, options)
      .pipe(
        catchError(error => {
          console.error('Failed to send sensor data:', error);
          // Return error details for better debugging
          return throwError(() => ({
            message: error.error?.message || error.message || 'Failed to send sensor data',
            status: error.status,
            error: error.error
          }));
        })
      );
  }

  getSensorData(): Observable<SensorData[]> {
    // Return static data directly (API disabled)
    if (!environment.enableApi) {
      return of(this.getStaticSensorData());
    }
    
    const options = this.authService.getAuthHeadersWithOptions();
    return this.http.get<SensorData[]>(`${this.apiUrl}/sensor-data`, options)
      .pipe(
        catchError(error => {
          console.warn('Failed to get sensor data:', error);
          return of(this.getStaticSensorData());
        })
      );
  }

  // NEW: Compare Day to Day
  compareDayToDay(date1: string, date2: string): Observable<any> {
    const options = this.authService.getAuthHeadersWithOptions();
    const url = `${this.apiUrl}/comparisons/day-to-day?date1=${date1}&date2=${date2}`;
    
    return this.http.get<any>(url, options)
      .pipe(
        catchError(error => {
          console.error('Failed to get comparison data:', error);
          // Return mock data if API is disabled or fails
          if (!environment.enableApi) {
            return of(this.getMockComparisonData(date1, date2));
          }
          return throwError(() => error);
        })
      );
  }

  private getStaticSensorData(): SensorData[] {
    return [
      { sensorId: 'sensor001', sensorType: 'temperature', value: 25.5, timestamp: new Date().toISOString(), location: 'Building A' },
      { sensorId: 'sensor002', sensorType: 'humidity', value: 60.2, timestamp: new Date().toISOString(), location: 'Building B' },
      { sensorId: 'sensor003', sensorType: 'pressure', value: 1013.25, timestamp: new Date().toISOString(), location: 'Building C' },
      { sensorId: 'sensor004', sensorType: 'temperature', value: 23.8, timestamp: new Date().toISOString(), location: 'Building A' },
      { sensorId: 'sensor005', sensorType: 'humidity', value: 58.5, timestamp: new Date().toISOString(), location: 'Building B' },
      { sensorId: 'sensor006', sensorType: 'light', value: 450, timestamp: new Date().toISOString(), location: 'Building C' },
      { sensorId: 'sensor007', sensorType: 'motion', value: 1, timestamp: new Date().toISOString(), location: 'Building A' }
    ];
  }

  // Mock comparison data for fallback
  private getMockComparisonData(date1: string, date2: string): any {
    return {
      date1: date1,
      date2: date2,
      summary: {
        totalSensorsDay1: 7,
        totalSensorsDay2: 8,
        averageValueDay1: 175.5,
        averageValueDay2: 180.2,
        difference: 4.7,
        percentageChange: 2.68,
        trend: 'increasing'
      },
      bySensorType: [
        {
          sensorType: 'temperature',
          day1Count: 2,
          day1Average: 24.65,
          day2Count: 2,
          day2Average: 26.0,
          difference: 1.35,
          percentageChange: 5.48
        },
        {
          sensorType: 'humidity',
          day1Count: 2,
          day1Average: 59.35,
          day2Count: 2,
          day2Average: 61.0,
          difference: 1.65,
          percentageChange: 2.78
        },
        {
          sensorType: 'pressure',
          day1Count: 1,
          day1Average: 1013.25,
          day2Count: 1,
          day2Average: 1015.0,
          difference: 1.75,
          percentageChange: 0.17
        }
      ],
      day1Data: [
        { sensorId: 'sensor001', type: 'temperature', value: 25.5, timestamp: `${date1}T12:00:00Z` },
        { sensorId: 'sensor002', type: 'humidity', value: 60.2, timestamp: `${date1}T12:00:00Z` }
      ],
      day2Data: [
        { sensorId: 'sensor001', type: 'temperature', value: 26.0, timestamp: `${date2}T12:00:00Z` },
        { sensorId: 'sensor002', type: 'humidity', value: 61.0, timestamp: `${date2}T12:00:00Z` }
      ]
    };
  }

  // Export Reports Methods
  exportReportAsPDF(reportData: any, period: string): Observable<Blob> {
    const options = {
      ...this.authService.getAuthHeadersWithOptions(),
      responseType: 'blob' as 'json'
    };
    
    return this.http.post<Blob>(`${this.apiUrl}/reports/pdf`, reportData, options)
      .pipe(
        catchError(error => {
          console.error('Failed to export PDF:', error);
          // Fallback: generate PDF client-side
          return throwError(() => error);
        })
      );
  }

  exportReportAsExcel(reportData: any, period: string): void {
    // Client-side Excel export using CSV format
    const csv = this.convertToCSV(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${period}-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  exportReportAsJSON(reportData: any, period: string): void {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${period}-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any): string {
    let csv = '';
    
    // Add summary reports
    csv += 'Summary Reports\n';
    csv += 'Title,Period,Value,Trend\n';
    if (data.reports && Array.isArray(data.reports)) {
      data.reports.forEach((report: any) => {
        csv += `"${report.title}","${report.period}","${report.value}","${report.trend}"\n`;
      });
    }
    csv += '\n';
    
    // Add sensor data
    csv += 'Sensor Data\n';
    csv += 'Sensor ID,Type,Value,Location,Timestamp\n';
    if (data.sensorData && Array.isArray(data.sensorData)) {
      data.sensorData.forEach((sensor: any) => {
        csv += `"${sensor.sensorId || ''}","${sensor.sensorType || ''}","${sensor.value || 0}","${sensor.location || ''}","${sensor.timestamp || ''}"\n`;
      });
    }
    
    return csv;
  }
}

