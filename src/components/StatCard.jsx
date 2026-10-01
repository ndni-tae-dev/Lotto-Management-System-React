import { Card } from 'react-bootstrap';

export default function StatCard({ label, value, variant = '' }) {
  return (
    <Card className={`stat-card ${variant ? `accent-${variant}` : ''}`}>
      <Card.Body>
        <div className="label-mini">{label}</div>
        <div className="stat-value">{value}</div>
      </Card.Body>
    </Card>
  );
}
