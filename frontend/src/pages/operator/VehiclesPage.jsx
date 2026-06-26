import { useEffect, useState } from 'react';
import { vehicleAPI } from '../../services/api';
import { PageHeader, Card, Input, Select, Button, Badge, EmptyState, Loading } from '../../components/ui';

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
    <div className="space-y-6">
      <PageHeader 
        title="Quản lý xe" 
        description="Thêm xe và loại xe để tạo lịch chạy cho nhà xe."
        actions={
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'} icon={<i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} />}>
            {showForm ? 'Đóng' : 'Thêm xe'}
          </Button>
        }
      />

      {error && <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>}

      {showForm && (
        <Card className="border-[#e85d04]/20 bg-orange-50/50 dark:bg-[#e85d04]/10 page-enter">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input 
              label="Biển số xe" 
              placeholder="51B-12345" 
              value={form.licensePlate} 
              onChange={e => setForm({ ...form, licensePlate: e.target.value })} 
              required 
            />
            <Select 
              label="Loại xe" 
              value={form.vehicleTypeId} 
              onChange={e => setForm({ ...form, vehicleTypeId: e.target.value })} 
              required
              options={[
                { value: '', label: 'Chọn loại xe' },
                ...vehicleTypes.map(type => ({ value: type.id, label: `${type.name} - ${type.seatCount} ghế` }))
              ]}
            />
            <Input 
              type="number" 
              label="Năm sản xuất" 
              placeholder="2022" 
              value={form.manufactureYear} 
              onChange={e => setForm({ ...form, manufactureYear: e.target.value })} 
            />
            <div className="flex items-end pt-2 border-t md:border-none border-gray-200 dark:border-slate-700 mt-2 md:mt-0">
              <Button type="submit" fullWidth>Thêm xe</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : vehicles.length === 0 ? (
        <EmptyState title="Chưa có xe nào" description="Thêm xe đầu tiên để bắt đầu tạo chuyến." icon="ti-car" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map(v => (
            <Card key={v.id} hover className="flex flex-col h-full border-l-4 border-l-blue-500">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between flex-1">
                <div>
                  <p className="font-black text-xl text-gray-900 dark:text-white mb-2">{v.licensePlate}</p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <i className="ti ti-bus text-gray-400" /> {v.vehicleType?.name}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <i className="ti ti-armchair text-gray-400" /> {v.vehicleType?.seatCount} ghế
                  </p>
                </div>
                <Button variant="ghost" className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/30" size="sm" onClick={() => handleDelete(v.id)}>
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
