import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Modal,
  Nav,
  Navbar,
  Row,
  Tab,
  Table,
  Tabs,
} from 'react-bootstrap';

const LOTTO_TYPES = [
  ['3 ตัวบน', 3, 900],
  ['3 ตัวโต๊ด', 3, 150],
  ['3 ตัวล่าง', 3, 450],
  ['2 ตัวบน', 2, 90],
  ['2 ตัวล่าง', 2, 90],
  ['วิ่งบน', 1, 3.2],
  ['วิ่งล่าง', 1, 3.2],
];

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];
const ADMIN_PASSWORD = '888888';

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
};

const money = (value) => `฿${Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
const fmt = (value) => Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
const thaiDate = (value) => {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

const generatePeriods = () => {
  const now = new Date();
  const result = [];
  for (let monthOffset = 0; monthOffset <= 12; monthOffset += 1) {
    const base = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    [1, 16].forEach((day) => {
      const d = new Date(base.getFullYear(), base.getMonth(), day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result.push(key);
    });
  }
  return [...new Set(result)].sort((a, b) => new Date(a) - new Date(b));
};

const getPeriodKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayPeriod = () => {
  const periods = generatePeriods();
  const today = getPeriodKey();
  return periods.find((p) => p >= today) || periods[periods.length - 1] || getPeriodKey();
};

const getTypeRate = (type, rates) => rates[type] ?? LOTTO_TYPES.find(([label]) => label === type)?.[2] ?? 0;
const getDigitsForType = (type) => LOTTO_TYPES.find(([label]) => label === type)?.[1] ?? 2;
const sortDigits = (value) => [...String(value || '')].sort().join('');

const generatePermutations = (value) => {
  const text = String(value || '');
  if (!text || text.length < 2) return [text];
  const set = new Set();
  const walk = (chars, prefix) => {
    if (chars.length === 0) {
      set.add(prefix);
      return;
    }
    for (let i = 0; i < chars.length; i += 1) {
      const next = chars.slice(0, i).concat(chars.slice(i + 1));
      walk(next, prefix + chars[i]);
    }
  };
  walk(text.split(''), '');
  return [...set];
};

const normalizeDraw = (draw) => {
  if (!draw) return null;
  return {
    first: String(draw.first || '').replace(/\D/g, ''),
    second: Array.isArray(draw.second) ? draw.second.map((n) => String(n || '').replace(/\D/g, '')) : [],
    third: Array.isArray(draw.third) ? draw.third.map((n) => String(n || '').replace(/\D/g, '')) : [],
    fourth: Array.isArray(draw.fourth) ? draw.fourth.map((n) => String(n || '').replace(/\D/g, '')) : [],
    fifth: Array.isArray(draw.fifth) ? draw.fifth.map((n) => String(n || '').replace(/\D/g, '')) : [],
    last2: Array.isArray(draw.last2) ? draw.last2.map((n) => String(n || '').replace(/\D/g, '')) : [],
    last3f: Array.isArray(draw.last3f) ? draw.last3f.map((n) => String(n || '').replace(/\D/g, '')) : [],
    last3b: Array.isArray(draw.last3b) ? draw.last3b.map((n) => String(n || '').replace(/\D/g, '')) : [],
    near1: Array.isArray(draw.near1) ? draw.near1.map((n) => String(n || '').replace(/\D/g, '')) : [],
    source: draw.source || 'manual',
  };
};

const calculatePayout = (item, draw, rates) => {
  if (!draw) return 0;
  const first = String(draw.first || '').replace(/\D/g, '');
  const last2 = (draw.last2 || [])[0] || '';
  const last3Set = [...(draw.last3f || []), ...(draw.last3b || [])];
  const t3 = first.slice(-3);
  const t2 = first.slice(-2);

  let won = false;
  switch (item.type) {
    case '3 ตัวบน':
      won = item.number === t3;
      break;
    case '3 ตัวโต๊ด':
      won = sortDigits(item.number) === sortDigits(t3);
      break;
    case '3 ตัวล่าง':
      won = last3Set.includes(item.number);
      break;
    case '2 ตัวบน':
      won = item.number === t2;
      break;
    case '2 ตัวล่าง':
      won = item.number === last2;
      break;
    case 'วิ่งบน':
      won = first.includes(item.number);
      break;
    case 'วิ่งล่าง':
      won = (last2 || '').includes(item.number);
      break;
    default:
      won = false;
  }

  return won ? Number(item.amount || 0) * (getTypeRate(item.type, rates) || 0) : 0;
};

const defaultRates = Object.fromEntries(LOTTO_TYPES.map(([label, , value]) => [label, value]));

export default function App() {
  const periods = useMemo(() => generatePeriods(), []);
  const [period, setPeriod] = useState(() => {
    const saved = storage.get('s8_per', null);
    return saved && periods.includes(saved) ? saved : getTodayPeriod();
  });
  const [theme, setTheme] = useState(() => (storage.get('s8_theme', 'light') === 'dark' ? 'dark' : 'light'));
  const [adminMode, setAdminMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [submissions, setSubmissions] = useState(() => storage.get('s8_submissions', []));
  const [customerName, setCustomerName] = useState(() => storage.get('s8_customer', ''));
  const [entryType, setEntryType] = useState('3 ตัวบน');
  const [entryNumber, setEntryNumber] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [reverseSwitch, setReverseSwitch] = useState(false);
  const [resultDraw, setResultDraw] = useState(() => normalizeDraw(storage.get('s8_draw', null)));
  const [manualFirst, setManualFirst] = useState('');
  const [manualLast2, setManualLast2] = useState('');
  const [manualLast3f, setManualLast3f] = useState('');
  const [manualLast3b, setManualLast3b] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [rates, setRates] = useState(() => ({ ...defaultRates, ...(storage.get('s8_rates', {})) }));
  const [news, setNews] = useState(() => storage.get('s8_news', [{ id: 'welcome', title: 'เริ่มต้นใช้งานใหม่', body: 'เช็กผลรางวัลและจัดการโพยจากศูนย์เดียว', at: new Date().toISOString() }]));
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [selectedSlipCustomer, setSelectedSlipCustomer] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    storage.set('s8_per', period);
  }, [period]);

  useEffect(() => {
    storage.set('s8_submissions', submissions);
  }, [submissions]);

  useEffect(() => {
    storage.set('s8_customer', customerName);
  }, [customerName]);

  useEffect(() => {
    storage.set('s8_draw', resultDraw);
  }, [resultDraw]);

  useEffect(() => {
    storage.set('s8_rates', rates);
  }, [rates]);

  useEffect(() => {
    storage.set('s8_news', news);
  }, [news]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.set('s8_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(''), 2200);
    return () => clearTimeout(timer);
  }, [notification]);

  const periodEntries = useMemo(
    () => submissions.filter((item) => String(item.period) === String(period)),
    [period, submissions]
  );

  const totalAmount = useMemo(
    () => periodEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [periodEntries]
  );

  const uniqueCustomerCount = useMemo(
    () => [...new Set(periodEntries.map((item) => item.customer).filter(Boolean))].length,
    [periodEntries]
  );

  const filteredEntries = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return periodEntries.filter((item) => {
      const matchesType = !filterType || item.type === filterType;
      const matchesKeyword = !keyword || item.customer.toLowerCase().includes(keyword) || item.number.includes(keyword);
      return matchesType && matchesKeyword;
    });
  }, [filterType, periodEntries, searchKeyword]);

  const currentWinningRows = useMemo(() => {
    if (!resultDraw) return [];
    return periodEntries
      .map((item) => ({ ...item, payout: calculatePayout(item, resultDraw, rates) }))
      .filter((item) => item.payout > 0);
  }, [periodEntries, resultDraw, rates]);

  const totalWinning = useMemo(
    () => currentWinningRows.reduce((sum, item) => sum + Number(item.payout || 0), 0),
    [currentWinningRows]
  );

  const groupedCustomers = useMemo(() => {
    const map = {};
    periodEntries.forEach((item) => {
      if (!map[item.customer]) map[item.customer] = [];
      map[item.customer].push(item);
    });
    return Object.entries(map)
      .map(([customer, rows]) => ({ customer, total: rows.reduce((sum, item) => sum + Number(item.amount || 0), 0), count: rows.length }))
      .sort((a, b) => b.total - a.total);
  }, [periodEntries]);

  const slipRows = useMemo(() => {
    if (!selectedSlipCustomer) return [];
    return periodEntries.filter((item) => item.customer === selectedSlipCustomer);
  }, [periodEntries, selectedSlipCustomer]);

  const isClosed = () => new Date() >= new Date(`${period}T14:00:00+07:00`) && !adminMode;

  const handleNumberInput = (value) => {
    const digits = getDigitsForType(entryType);
    setEntryNumber(String(value).replace(/\D/g, '').slice(0, digits));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanCustomer = customerName.trim();
    const digits = getDigitsForType(entryType);
    const amountValue = Number(entryAmount);

    if (!cleanCustomer) {
      setError('กรุณากรอกชื่อลูกค้า');
      return;
    }
    if (!entryNumber || entryNumber.length !== digits) {
      setError(`กรอกเลขให้ครบ ${digits} หลัก`);
      return;
    }
    if (!(amountValue > 0)) {
      setError('กรุณากรอกจำนวนเงินมากกว่า 0');
      return;
    }
    if (isClosed()) {
      setError('ปิดรับโพยงวดนี้แล้ว');
      return;
    }

    const variants = reverseSwitch ? generatePermutations(entryNumber) : [entryNumber];
    const rows = variants.map((number) => ({
      type: entryType,
      number,
      amount: amountValue,
    }));

    const newItems = rows.map((row, index) => ({
      id: `${Date.now()}-${index}`,
      customer: cleanCustomer,
      period,
      type: row.type,
      number: row.number,
      amount: row.amount,
      at: new Date().toISOString(),
    }));

    setSubmissions((prev) => [...prev, ...newItems]);
    setEntryAmount('');
    setEntryNumber('');
    setReverseSwitch(false);
    setError('');
    setNotification('บันทึกโพยเรียบร้อยแล้ว');
  };

  const handleDelete = (id) => {
    setSubmissions((prev) => prev.filter((item) => String(item.id) !== String(id)));
    setNotification('ลบรายการแล้ว');
  };

  const handleClearPeriod = () => {
    if (!periodEntries.length) {
      setNotification('ไม่มีรายการในงวดนี้');
      return;
    }
    if (window.confirm(`ลบโพยงวดนี้ทั้งหมด ${periodEntries.length} รายการ?`)) {
      setSubmissions((prev) => prev.filter((item) => String(item.period) !== String(period)));
      setNotification('ลบโพยงวดนี้แล้ว');
    }
  };

  const handleExportCsv = () => {
    if (!filteredEntries.length) {
      setNotification('ไม่มีข้อมูลให้ส่งออก');
      return;
    }
    const lines = [
      ['งวด', 'ลูกค้า', 'ประเภท', 'เลข', 'จำนวนเงิน'].join(','),
      ...filteredEntries.map((item) => [item.period, item.customer, item.type, item.number, item.amount].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `soi888-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotification('ส่งออก CSV เรียบร้อย');
  };

  const handleManualDraw = () => {
    const first = manualFirst.replace(/\D/g, '').slice(0, 6);
    const last2 = manualLast2.replace(/\D/g, '').slice(0, 2);
    const last3f = manualLast3f.replace(/\D/g, '').slice(0, 3);
    const last3b = manualLast3b.replace(/\D/g, '').slice(0, 3);

    if (!first || !last2 || !last3f || !last3b) {
      setNotification('กรอกข้อมูลผลรางวัลให้ครบ');
      return;
    }

    setResultDraw(normalizeDraw({
      first,
      last2: [last2],
      last3f: [last3f],
      last3b: [last3b],
      source: 'manual',
    }));
    setNotification('บันทึกผลรางวัลเองเรียบร้อย');
  };

  const loginAdmin = () => {
    if (loginPassword === ADMIN_PASSWORD) {
      setAdminMode(true);
      setShowLogin(false);
      setLoginPassword('');
      setNotification('เข้าสู่ระบบผู้ดูแลแล้ว');
      return;
    }
    setNotification('รหัสผ่านไม่ถูกต้อง');
  };

  const logoutAdmin = () => {
    setAdminMode(false);
    setNotification('ออกจากระบบผู้ดูแล');
  };

  const wrapperRate = getTypeRate(entryType, rates);

  return (
    <div className="app-shell">
      <Navbar bg="dark" variant="dark" className="shadow-sm px-3">
        <Container fluid>
          <Navbar.Brand>ซอย888 · ระบบจัดการโพย</Navbar.Brand>
          <Nav className="ms-auto align-items-center gap-2">
            <Form.Select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-select">
              {periods.map((value) => (
                <option key={value} value={value}>{thaiDate(value)}</option>
              ))}
            </Form.Select>
            <Button variant="outline-light" size="sm" onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
            <Button variant={adminMode ? 'success' : 'outline-light'} size="sm" onClick={() => (adminMode ? logoutAdmin() : setShowLogin(true))}>
              {adminMode ? 'ผู้ดูแล' : 'ล็อกอิน'}
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="py-4">
        {notification && (
          <Alert variant="success" className="toast-alert" dismissible onClose={() => setNotification('')}>
            {notification}
          </Alert>
        )}

        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="stat-card">
              <Card.Body>
                <div className="label-mini">จำนวนโพย</div>
                <div className="stat-value">{periodEntries.length}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card accent-pink">
              <Card.Body>
                <div className="label-mini">ยอดรับรวม</div>
                <div className="stat-value">{money(totalAmount)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card accent-purple">
              <Card.Body>
                <div className="label-mini">ลูกค้า</div>
                <div className="stat-value">{uniqueCustomerCount}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="entry" className="mb-4 custom-tabs">
          <Tab eventKey="entry" title="คีย์โพย">
            <Row className="g-3">
              <Col lg={7}>
                <Card className="shadow-sm h-100">
                  <Card.Header className="fw-bold">บันทึกโพย</Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>ชื่อลูกค้า</Form.Label>
                        <Form.Control list="customer-list" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="เช่น เจ๊สมศรี" />
                        <datalist id="customer-list">
                          {[...new Set(submissions.map((item) => item.customer).filter(Boolean))].map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>ประเภท</Form.Label>
                            <Form.Select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
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
                              onChange={(e) => handleNumberInput(e.target.value)}
                              inputMode="numeric"
                              placeholder={String(getDigitsForType(entryType)).padStart(2, '0')}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>จำนวนเงิน (บาท)</Form.Label>
                        <Form.Control type="number" min="1" step="any" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0" />
                      </Form.Group>

                      <div className="quick-amounts mb-3">
                        {QUICK_AMOUNTS.map((amount) => (
                          <Button key={amount} variant="outline-secondary" size="sm" onClick={() => setEntryAmount(String(amount))}>
                            {fmt(amount)}
                          </Button>
                        ))}
                      </div>

                      <Form.Check
                        type="checkbox"
                        label="กลับเลข (สลับหลักทุกแบบ)"
                        checked={reverseSwitch}
                        onChange={(e) => setReverseSwitch(e.target.checked)}
                        className="mb-3"
                      />

                      <div className="hint mb-3 text-muted">
                        ถ้าถูก จ่าย {money((Number(entryAmount) || 0) * (wrapperRate || 0))} ({fmt(wrapperRate || 0)} เท่า)
                      </div>

                      {error && <Alert variant="danger">{error}</Alert>}

                      <Button type="submit" className="w-100 primary-gradient">
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
                    <ListGroup variant="flush">
                      {periodEntries.slice().reverse().slice(0, 8).map((item) => (
                        <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{item.number}</strong>
                            <div className="small text-muted">{item.customer}</div>
                          </div>
                          <div className="text-end">
                            <div className="small text-muted">{item.type}</div>
                            <strong>{money(item.amount)}</strong>
                            <Button variant="link" size="sm" className="p-0 ms-2 text-danger" onClick={() => handleDelete(item.id)}>
                              ลบ
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                      {!periodEntries.length && <ListGroup.Item className="text-muted">ยังไม่มีข้อมูลโพยในงวดนี้</ListGroup.Item>}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="list" title="รายการโพย">
            <Card className="shadow-sm">
              <Card.Body>
                <Row className="g-2 mb-3">
                  <Col md={6}>
                    <Form.Control value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="ค้นหาชื่อหรือเลข" />
                  </Col>
                  <Col md={3}>
                    <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                      <option value="">ทุกประเภท</option>
                      {LOTTO_TYPES.map(([label]) => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3} className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={handleExportCsv}>ส่งออก CSV</Button>
                    <Button variant="outline-danger" onClick={handleClearPeriod}>ล้างงวด</Button>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>เลข</th>
                        <th>ลูกค้า</th>
                        <th>ประเภท</th>
                        <th className="text-end">จำนวนเงิน</th>
                        <th>เวลา</th>
                        <th>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((item) => {
                        const payout = resultDraw ? calculatePayout(item, resultDraw, rates) : 0;
                        return (
                          <tr key={item.id} className={payout > 0 ? 'winning-row' : ''}>
                            <td className="fw-bold">{item.number}</td>
                            <td>{item.customer}</td>
                            <td><Badge bg="secondary">{item.type}</Badge></td>
                            <td className="text-end">{money(item.amount)}</td>
                            <td>{new Date(item.at).toLocaleTimeString('th-TH')}</td>
                            <td>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>ลบ</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  {!filteredEntries.length && <div className="text-center text-muted py-4">ไม่มีข้อมูลที่ตรงกับเงื่อนไข</div>}
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="customers" title="สรุปลูกค้า">
            <Row className="g-3">
              {groupedCustomers.map(({ customer, total, count }) => (
                <Col md={4} key={customer}>
                  <Card className="shadow-sm h-100 customer-card">
                    <Card.Body>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar">{customer.trim().charAt(0) || 'N'}</div>
                        <div>
                          <div className="fw-bold">{customer}</div>
                          <div className="text-muted small">{count} รายการ</div>
                        </div>
                      </div>
                      <hr />
                      <div className="fw-bold text-end">{money(total)}</div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
              {!groupedCustomers.length && <Col><Alert variant="light">ยังไม่มีลูกค้าในงวดนี้</Alert></Col>}
            </Row>
          </Tab>

          <Tab eventKey="result" title="ผลรางวัล">
            <Card className="shadow-sm">
              <Card.Header className="fw-bold">ผลสลากกินแบ่งรัฐบาล {thaiDate(period)}</Card.Header>
              <Card.Body>
                {resultDraw ? (
                  <>
                    <div className="big-prize text-center mb-4">
                      <div className="small-label">รางวัลที่ 1</div>
                      <div className="prize-number">{resultDraw.first}</div>
                    </div>
                    <Row className="g-3">
                      <Col md={4}><div className="mini-box"><span>เลขท้าย 2 ตัว</span><strong>{resultDraw.last2?.[0] || '-'}</strong></div></Col>
                      <Col md={4}><div className="mini-box"><span>เลขหน้า 3 ตัว</span><strong>{resultDraw.last3f?.[0] || '-'}</strong></div></Col>
                      <Col md={4}><div className="mini-box"><span>เลขท้าย 3 ตัว</span><strong>{resultDraw.last3b?.[0] || '-'}</strong></div></Col>
                    </Row>
                  </>
                ) : (
                  <Alert variant="warning">ยังไม่มีผลรางวัลของงวดนี้ กรุณากรอกผลรางวัลเอง</Alert>
                )}

                <div className="manual-result mt-4">
                  <h5>กรอกผลรางวัลเอง</h5>
                  <Row className="g-2">
                    <Col md={3}><Form.Control placeholder="รางวัลที่ 1 (6 หลัก)" value={manualFirst} onChange={(e) => setManualFirst(e.target.value)} /></Col>
                    <Col md={3}><Form.Control placeholder="เลขท้าย 2 ตัว" value={manualLast2} onChange={(e) => setManualLast2(e.target.value)} /></Col>
                    <Col md={3}><Form.Control placeholder="เลขหน้า 3 ตัว" value={manualLast3f} onChange={(e) => setManualLast3f(e.target.value)} /></Col>
                    <Col md={3}><Form.Control placeholder="เลขท้าย 3 ตัว" value={manualLast3b} onChange={(e) => setManualLast3b(e.target.value)} /></Col>
                  </Row>
                  <div className="mt-3"><Button variant="primary" onClick={handleManualDraw}>บันทึกผลรางวัล</Button></div>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="check" title="เช็กโพย">
            <Card className="shadow-sm">
              <Card.Header className="fw-bold">ตรวจสอบผลคูปอง</Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}><div className="summary-box"><span>ยอดรับ</span><strong>{money(totalAmount)}</strong></div></Col>
                  <Col md={4}><div className="summary-box"><span>ยอดจ่าย</span><strong>{money(totalWinning)}</strong></div></Col>
                  <Col md={4}><div className="summary-box"><span>กำไร/ขาดทุน</span><strong>{money(totalAmount - totalWinning)}</strong></div></Col>
                </Row>

                <div className="mt-4">
                  {currentWinningRows.length ? (
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>ลูกค้า</th>
                          <th>เลข</th>
                          <th>ประเภท</th>
                          <th className="text-end">ยอดจ่าย</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentWinningRows.map((item) => (
                          <tr key={item.id}>
                            <td>{item.customer}</td>
                            <td>{item.number}</td>
                            <td>{item.type}</td>
                            <td className="text-end">{money(item.payout)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">ยังไม่มีโพยที่ถูกรางวัลในงวดนี้</Alert>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="receipt" title="ใบรับโพย">
            <Card className="shadow-sm">
              <Card.Header className="fw-bold">ใบรับโพย</Card.Header>
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={6}>
                    <Form.Select value={selectedSlipCustomer || ''} onChange={(e) => setSelectedSlipCustomer(e.target.value)}>
                      <option value="">เลือกลูกค้า</option>
                      {[...new Set(periodEntries.map((item) => item.customer).filter(Boolean))].map((customer) => (
                        <option key={customer} value={customer}>{customer}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button variant="secondary" onClick={() => window.print()}>พิมพ์ใบรับ</Button>
                  </Col>
                </Row>

                {selectedSlipCustomer && (
                  <div className="receipt-paper mt-4">
                    <div className="text-center mb-3">
                      <h4 className="mb-1">ซอย888</h4>
                      <div className="small text-muted">ใบรับโพย • {thaiDate(period)}</div>
                    </div>
                    <div className="d-flex justify-content-between"><span>ลูกค้า</span><strong>{selectedSlipCustomer}</strong></div>
                    <hr />
                    {slipRows.map((item) => (
                      <div key={item.id} className="d-flex justify-content-between small py-1 border-bottom">
                        <span>{item.type} {item.number}</span>
                        <strong>{money(item.amount)}</strong>
                      </div>
                    ))}
                    <div className="d-flex justify-content-between mt-3 fw-bold">
                      <span>รวม</span>
                      <span>{money(slipRows.reduce((sum, item) => sum + Number(item.amount), 0))}</span>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="settings" title="ตั้งค่า">
            <Row className="g-3">
              <Col lg={6}>
                <Card className="shadow-sm h-100">
                  <Card.Header className="fw-bold">อัตราจ่าย</Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      {LOTTO_TYPES.map(([label]) => (
                        <Col md={6} key={label}>
                          <Form.Group>
                            <Form.Label>{label}</Form.Label>
                            <Form.Control
                              type="number"
                              min="0"
                              step="any"
                              value={rates[label] ?? 0}
                              onChange={(e) => setRates((prev) => ({ ...prev, [label]: Number(e.target.value) || 0 }))}
                            />
                          </Form.Group>
                        </Col>
                      ))}
                    </Row>
                    <div className="mt-3 d-flex gap-2">
                      <Button variant="primary" onClick={() => setRates({ ...defaultRates })}>รีเซ็ต</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6}>
                <Card className="shadow-sm h-100">
                  <Card.Header className="fw-bold">ประกาศถึงลูกค้า</Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>หัวข้อ</Form.Label>
                      <Form.Control value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>รายละเอียด</Form.Label>
                      <Form.Control as="textarea" rows={4} value={newsBody} onChange={(e) => setNewsBody(e.target.value)} />
                    </Form.Group>
                    <Button variant="primary" onClick={() => {
                      if (!newsTitle.trim()) {
                        setNotification('กรุณาใส่หัวข้อประกาศ');
                        return;
                      }
                      setNews((prev) => [{
                        id: `${Date.now()}`,
                        title: newsTitle.trim(),
                        body: newsBody.trim(),
                        at: new Date().toISOString(),
                      }, ...prev]);
                      setNewsTitle('');
                      setNewsBody('');
                      setNotification('เพิ่มประกาศเรียบร้อย');
                    }}>เพิ่มประกาศ</Button>

                    <div className="mt-4">
                      <ListGroup>
                        {news.map((item) => (
                          <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="fw-bold">{item.title}</div>
                              <div className="small text-muted">{item.body || 'ไม่มีรายละเอียด'}</div>
                            </div>
                            <Button variant="outline-danger" size="sm" onClick={() => setNews((prev) => prev.filter((entry) => entry.id !== item.id))}>ลบ</Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>
      </Container>

      <Modal show={showLogin} onHide={() => setShowLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>เข้าสู่ระบบผู้ดูแล</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="รหัสผ่านผู้ดูแล" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogin(false)}>ยกเลิก</Button>
          <Button variant="primary" onClick={loginAdmin}>เข้าสู่ระบบ</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
