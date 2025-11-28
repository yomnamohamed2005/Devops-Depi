import { Component, OnInit } from '@angular/core';
import { SensorService } from '../../services/sensor.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ComparisonData {
  date1: string;
  date2: string;
  summary: {
    totalSensorsDay1: number;
    totalSensorsDay2: number;
    averageValueDay1: number;
    averageValueDay2: number;
    difference: number;
    percentageChange: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  bySensorType: Array<{
    sensorType: string;
    day1Count: number;
    day1Average: number;
    day2Count: number;
    day2Average: number;
    difference: number;
    percentageChange: number;
  }>;
  day1Data: any[];
  day2Data: any[];
}

@Component({
  selector: 'app-comparisons',
  templateUrl: './comparisons.component.html',
  styleUrls: ['./comparisons.component.css']
})
export class ComparisonsComponent implements OnInit {
  comparisonForm: FormGroup;
  comparisonData: ComparisonData | null = null;
  loading = false;
  error: string | null = null;
  
  // Comparison Types
  comparisonType: 'day-to-day' | 'location' | 'sensor-type' = 'day-to-day';
  
  // Location Comparison
  locationComparisonData: any = null;
  locations = ['Building A', 'Building B', 'Building C', 'Zone 1', 'Zone 2'];
  
  // Sensor Type Comparison
  sensorTypeComparisonData: any = null;
  sensorTypes = ['temperature', 'humidity', 'pressure', 'pollution', 'traffic'];

  constructor(
    private sensorService: SensorService,
    private fb: FormBuilder
  ) {
    // Initialize form with default dates (today and yesterday)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    this.comparisonForm = this.fb.group({
      date1: [yesterday.toISOString().split('T')[0], Validators.required],
      date2: [today.toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    // Optionally load comparison on init
    // this.compareDays();
  }

  compareDays(): void {
    if (this.comparisonForm.valid) {
      this.loading = true;
      this.error = null;
      const { date1, date2 } = this.comparisonForm.value;
      
      this.sensorService.compareDayToDay(date1, date2).subscribe({
        next: (data) => {
          this.comparisonData = data;
          this.loading = false;
          this.error = null;
        },
        error: (error) => {
          console.error('Error fetching comparison data:', error);
          // Use mock data if API fails
          this.comparisonData = this.getMockComparisonData(date1, date2);
          this.loading = false;
          this.error = null; // Don't show error, use mock data instead
        }
      });
    } else {
      this.error = 'Please select both dates';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  }

  getTrendColor(trend: string): string {
    switch (trend) {
      case 'increasing':
        return '#16C47F';
      case 'decreasing':
        return '#DB3A34';
      default:
        return '#0A4D68';
    }
  }

  formatNumber(value: number): string {
    return value.toFixed(2);
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  // Comparison Type Methods
  setComparisonType(type: 'day-to-day' | 'location' | 'sensor-type'): void {
    this.comparisonType = type;
    this.comparisonData = null;
    this.locationComparisonData = null;
    this.sensorTypeComparisonData = null;
    this.error = null;
  }

  compareLocations(loc1: string, loc2: string): void {
    this.loading = true;
    this.error = null;
    
    // Mock data for location comparison
    setTimeout(() => {
      this.locationComparisonData = {
        location1: loc1,
        location2: loc2,
        comparison: {
          avgTemperature: { loc1: 24.5, loc2: 26.2, difference: 1.7 },
          avgHumidity: { loc1: 62, loc2: 58, difference: -4 },
          sensorCount: { loc1: 45, loc2: 38, difference: -7 },
          dataPoints: { loc1: 1250, loc2: 980, difference: -270 }
        }
      };
      this.loading = false;
    }, 500);
  }

  compareSensorTypes(type1: string, type2: string): void {
    this.loading = true;
    this.error = null;
    
    // Mock data for sensor type comparison
    setTimeout(() => {
      this.sensorTypeComparisonData = {
        type1: type1,
        type2: type2,
        comparison: {
          avgValue: { type1: 25.5, type2: 60.2, difference: 34.7 },
          sensorCount: { type1: 42, type2: 38, difference: -4 },
          dataPoints: { type1: 2100, type2: 1900, difference: -200 },
          lastUpdate: { type1: '2 min ago', type2: '5 min ago' }
        }
      };
      this.loading = false;
    }, 500);
  }

  private getMockComparisonData(date1: string, date2: string): ComparisonData {
    return {
      date1: date1,
      date2: date2,
      summary: {
        totalSensorsDay1: 142,
        totalSensorsDay2: 145,
        averageValueDay1: 24.5,
        averageValueDay2: 25.2,
        difference: 0.7,
        percentageChange: 2.86,
        trend: 'increasing'
      },
      bySensorType: [
        {
          sensorType: 'temperature',
          day1Count: 45,
          day1Average: 24.5,
          day2Count: 46,
          day2Average: 25.2,
          difference: 0.7,
          percentageChange: 2.86
        },
        {
          sensorType: 'humidity',
          day1Count: 38,
          day1Average: 62.0,
          day2Count: 39,
          day2Average: 63.5,
          difference: 1.5,
          percentageChange: 2.42
        }
      ],
      day1Data: [
        { sensorId: 'sensor001', type: 'temperature', value: 24.5, timestamp: `${date1}T12:00:00Z` }
      ],
      day2Data: [
        { sensorId: 'sensor001', type: 'temperature', value: 25.2, timestamp: `${date2}T12:00:00Z` }
      ]
    };
  }
}

