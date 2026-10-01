import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { fmt, money } from '../utils/formatters';
import { LOTTO_TYPES, QUICK_AMOUNTS } from '../utils/constants';
import { getDigitsForType, getTypeRate } from '../utils/lotto';

export default function EntryForm({
  customerName,
  onCustomerChange,
  customerList,
  entryType,
  onTypeChange,
  entryNumber,
  onNumberChange,
  entryAmount,
  onAmountChange,
  reverseSwitch,
  onReverseChange,
  error,
  rates,
  onSubmit,
  disabled = false,
  recentEntries,
  onRecentDelete,
}) {
  const digits = getDigitsForType(entryType);
  const rate = getTypeRate(entryType, rates);
  const expectedPayout = (Number(entryAmount) || 0) * (rate || 0);

  return (
    <Row className="g-3">
      <Col lg={7}>
        <Card className="shadow-sm h-100">
          <Card.Header className="fw-bold">บันทึกโพย</Card.Header>
          <Card.Body>
            <Form onSubmit={onSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>ชื่อลูกค้า</Form.Label>
                <Form.Control
                  list="customer-list"
                  value={customerName}
                  onChange={(e) => onCustomerChange(e.target.value)}
                  placeholder="เช่น เจ๊สมศรี"
                  disabled={disabled}
                />
                <datalist id="customer-list">
                  {customerList.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>ประเภท</Form.Label>
                    <Form.Select value={entryType} onChange={(e) => onTypeChange(e.target.value)} disabled={disabled}>
                      {LOTTO_TYPES.map(([label]) => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>เลข</Form.Label>
                    <Form.Control
                      className="text-center fw-bold"
                      value={entryNumber}
                      onChange={(e) => onNumberChange(e.target.value)}
                      inputMode="numeric"
                      placeholder={String(digits).padStart(2, '0')}
                      disabled={disabled}
                      maxLength={digits}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>จำนวนเงิน (บาท)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  step="any"
                  value={entryAmount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  placeholder="0"
                  disabled={disabled}
                />
              </Form.Group>

              <div className="quick-amounts mb-3">
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => onAmountChange(String(amount))}
                    disabled={disabled}
                  >
                    {fmt(amount)}
                  </Button>
                ))}
              </div>

              <Form.Check
                type="checkbox"
                label="กลับเลข (สลับหลักทุกแบบ)"
                checked={reverseSwitch}
                onChange={(e) => onReverseChange(e.target.checked)}
                className="mb-3"
                disabled={disabled}
              />

              <div className="hint mb-3 text-muted">
                {entryAmount ? `ถ้าถูก จ่าย ${money(expectedPayout)} (${fmt(rate)} เท่า)` : `อัตราจ่าย ${fmt(rate)} เท่า`}
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Button type="submit" className="w-100 primary-gradient" disabled={disabled}>
                บันทึกโพย
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={5}>
        <Card className="shadow-sm h-100">
          <Card.Header className="fw-bold">คีย์ล่าสุด</Card.Header>
          <Card.Body>
            {recentEntries.length > 0 ? (
              <div className="recent-entries">
                {recentEntries.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                    <div>
                      <strong className="d-block">{item.number}</strong>
                      <small className="text-muted">{item.customer}</small>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">{item.type}</small>
                      <strong>{money(item.amount)}</strong>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 ms-2 text-danger"
                        onClick={() => onRecentDelete(item.id)}
                      >
                        ลบ
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-center py-4">ยังไม่มีข้อมูลโพยในงวดนี้</div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
