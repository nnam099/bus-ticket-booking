// VehiclesPage.jsx
import { useEffect, useState } from 'react';
import { vehicleAPI } from '../../services/api';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ licensePlate: '', vehicleTypeId: '', manufactureYear: '' });

  const loadVehicles = () => vehicleAPI.getMyVehicles().then(r => setVehicles(r.data.data));

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
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa xe này?')) return;
    await vehicleAPI.delete(id);
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý xe</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2">
          {showForm ? 'Đóng' : '+ Thêm xe'}
        </button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div><label className="label">Biển số xe</label><input className="input" placeholder="51B-12345" value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} required /></div>
            <div>
              <label className="label">Loại xe</label>
              <select className="input" value={form.vehicleTypeId} onChange={e => setForm({ ...form, vehicleTypeId: e.target.value })} required>
                <option value="">Chọn loại xe</option>
                {vehicleTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name} - {type.seatCount} ghế</option>
                ))}
              </select>
            </div>
            <div><label className="label">Năm sản xuất</label><input type="number" className="input" placeholder="2022" value={form.manufactureYear} onChange={e => setForm({ ...form, manufactureYear: e.target.value })} /></div>
            <div className="col-span-2"><button type="submit" className="btn-primary py-2">Thêm xe</button></div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        {vehicles.map(v => (
          <div key={v.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{v.licensePlate}</p>
              <p className="text-sm text-gray-500">{v.vehicleType?.name} • {v.vehicleType?.seatCount} ghế</p>
            </div>
            <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️ Xóa</button>
          </div>
        ))}
        {vehicles.length === 0 && <div className="card text-center py-12 text-gray-500"><p>Chưa có xe nào.</p></div>}
      </div>
    </div>
  );
}
