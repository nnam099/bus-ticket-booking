import { useEffect, useState } from 'react';
import { vehicleAPI } from '../../services/api';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ licensePlate: '', vehicleTypeId: '', manufactureYear: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVehicles = () => {
    setError('');
    return vehicleAPI.getMyVehicles()
      .then(r => setVehicles(r.data.data))
      .catch(() => setError('Không thể tải danh sách xe.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVehicles();
    vehicleAPI.getTypes().then(r => setVehicleTypes(r.data.data)).catch(() => setVehicleTypes([]));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await vehicleAPI.create(form);
      setShowForm(false);
      setForm({ licensePlate: '', vehicleTypeId: '', manufactureYear: '' });
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Thêm xe thất bại.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa xe này?')) return;
    try {
      await vehicleAPI.delete(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa xe thất bại.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý xe</h1>
          <p className="mt-1 text-sm text-gray-500">Thêm xe và loại xe để tạo lịch chạy cho nhà xe.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
          {showForm ? 'Đóng' : '+ Thêm xe'}
        </button>
      </div>

      {error && <div className="card mb-4 border-red-200 bg-red-50 text-sm font-medium text-red-700">{error}</div>}

      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Biển số xe</label>
              <input className="input" placeholder="51B-12345" value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} required />
            </div>
            <div>
              <label className="label">Loại xe</label>
              <select className="input" value={form.vehicleTypeId} onChange={e => setForm({ ...form, vehicleTypeId: e.target.value })} required>
                <option value="">Chọn loại xe</option>
                {vehicleTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name} - {type.seatCount} ghế</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Năm sản xuất</label>
              <input type="number" className="input" placeholder="2022" value={form.manufactureYear} onChange={e => setForm({ ...form, manufactureYear: e.target.value })} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full py-2">Thêm xe</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="card animate-pulse">
              <div className="h-5 w-36 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-56 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card text-center py-14">
          <p className="font-semibold text-gray-800">Chưa có xe nào</p>
          <p className="mt-1 text-sm text-gray-500">Thêm xe đầu tiên để bắt đầu tạo chuyến.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {vehicles.map(v => (
            <article key={v.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{v.licensePlate}</p>
                  <p className="mt-1 text-sm text-gray-500">{v.vehicleType?.name} · {v.vehicleType?.seatCount} ghế</p>
                </div>
                <button onClick={() => handleDelete(v.id)} className="text-sm font-semibold text-red-500 hover:text-red-700">
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
