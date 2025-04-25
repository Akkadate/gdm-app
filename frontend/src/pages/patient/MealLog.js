import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

// Validation Schema
const MealSchema = Yup.object().shape({
  meal_type: Yup.string().required("กรุณาเลือกมื้ออาหาร"),
  food_items: Yup.string().required("กรุณาระบุรายการอาหาร"),
  carbohydrate_amount: Yup.number()
    .nullable()
    .typeError("ต้องเป็นตัวเลขเท่านั้น")
    .min(0, "ค่าต้องไม่ต่ำกว่า 0"),
});

const MealLog = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [editingMeal, setEditingMeal] = useState(null);
  const [filterDays, setFilterDays] = useState(7);

  useEffect(() => {
    fetchMeals();
  }, [filterDays]);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/meals?days=${filterDays}`
      );
      setMeals(response.data);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const formattedTime = format(time, "HH:mm");

      const mealData = {
        ...values,
        meal_date: formattedDate,
        meal_time: formattedTime,
      };

      if (editingMeal) {
        // แก้ไขรายการอาหาร
        await axios.put(
          `${process.env.REACT_APP_API_URL}/meals/${editingMeal.id}`,
          mealData
        );
        toast.success("แก้ไขข้อมูลสำเร็จ");
        setEditingMeal(null);
      } else {
        // เพิ่มรายการอาหารใหม่
        await axios.post(`${process.env.REACT_APP_API_URL}/meals`, mealData);
        toast.success("บันทึกข้อมูลสำเร็จ");
      }

      resetForm();
      setDate(new Date());
      setTime(new Date());
      fetchMeals();
    } catch (error) {
      console.error("Error saving meal:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/meals/${id}`);
        toast.success("ลบข้อมูลสำเร็จ");
        fetchMeals();
      } catch (error) {
        console.error("Error deleting meal:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setDate(new Date(meal.meal_date));
    setTime(new Date(`2000-01-01T${meal.meal_time}`));
  };

  const handleCancelEdit = () => {
    setEditingMeal(null);
    setDate(new Date());
    setTime(new Date());
  };

  // จัดกลุ่มข้อมูลตามวันที่
  const groupMealsByDate = () => {
    const grouped = {};

    meals.forEach((meal) => {
      const date = meal.meal_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(meal);
    });

    // เรียงตามวันที่ล่าสุด
    return Object.entries(grouped).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );
  };

  const mealTypes = [
    { value: "breakfast", label: "มื้อเช้า" },
    { value: "lunch", label: "มื้อกลางวัน" },
    { value: "dinner", label: "มื้อเย็น" },
    { value: "snack", label: "อาหารว่าง" },
  ];

  const getMealTypeLabel = (type) => {
    const mealType = mealTypes.find((mt) => mt.value === type);
    return mealType ? mealType.label : type;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">บันทึกอาหาร</h1>

      {/* แบบฟอร์มบันทึกอาหาร */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingMeal ? "แก้ไขบันทึกอาหาร" : "บันทึกอาหาร"}
        </h2>

        <Formik
          initialValues={{
            meal_type: editingMeal ? editingMeal.meal_type : "",
            food_items: editingMeal ? editingMeal.food_items : "",
            carbohydrate_amount: editingMeal
              ? editingMeal.carbohydrate_amount
              : "",
            notes: editingMeal ? editingMeal.notes : "",
          }}
          enableReinitialize={true}
          validationSchema={MealSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="meal_date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    วันที่
                  </label>
                  <DatePicker
                    selected={date}
                    onChange={setDate}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    maxDate={new Date()}
                  />
                </div>

                <div>
                  <label
                    htmlFor="meal_time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    เวลา
                  </label>
                  <DatePicker
                    selected={time}
                    onChange={setTime}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="เวลา"
                    dateFormat="HH:mm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="meal_type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    มื้ออาหาร
                  </label>
                  <Field
                    as="select"
                    name="meal_type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">เลือกมื้ออาหาร</option>
                    {mealTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="meal_type"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="carbohydrate_amount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ปริมาณคาร์โบไฮเดรต (กรัม)
                  </label>
                  <Field
                    type="number"
                    name="carbohydrate_amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ระบุปริมาณคาร์โบไฮเดรต"
                  />
                  <ErrorMessage
                    name="carbohydrate_amount"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="food_items"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  รายการอาหาร
                </label>
                <Field
                  as="textarea"
                  name="food_items"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="ระบุรายการอาหารที่รับประทาน"
                />
                <ErrorMessage
                  name="food_items"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  บันทึกเพิ่มเติม
                </label>
                <Field
                  as="textarea"
                  name="notes"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                />
                <ErrorMessage
                  name="notes"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting
                    ? "กำลังบันทึก..."
                    : editingMeal
                    ? "อัปเดต"
                    : "บันทึก"}
                </button>

                {editingMeal && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* ตัวกรองข้อมูล */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">
            แสดงข้อมูลย้อนหลัง:
          </span>
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={7}>7 วัน</option>
            <option value={14}>14 วัน</option>
            <option value={30}>30 วัน</option>
            <option value={90}>3 เดือน</option>
          </select>
        </div>
      </div>

      {/* แสดงประวัติการบันทึกอาหาร */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">ประวัติการบันทึกอาหาร</h2>

        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">ยังไม่มีข้อมูลการบันทึกอาหาร</p>
            <p className="text-gray-500 mt-2">
              กรุณาเพิ่มข้อมูลโดยใช้แบบฟอร์มด้านบน
            </p>
          </div>
        ) : (
          groupMealsByDate().map(([date, dateMeals]) => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-medium mb-2 border-b pb-1">
                {format(new Date(date), "EEEE d MMMM yyyy", { locale: th })}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {dateMeals
                  .sort((a, b) => a.meal_time.localeCompare(b.meal_time))
                  .map((meal) => (
                    <div
                      key={meal.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="font-semibold">
                              {getMealTypeLabel(meal.meal_type)}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {format(
                                new Date(`2000-01-01T${meal.meal_time}`),
                                "HH:mm น."
                              )}
                            </span>
                          </div>

                          <div className="mt-2">
                            <p className="text-gray-700">{meal.food_items}</p>
                          </div>

                          {meal.carbohydrate_amount && (
                            <div className="mt-1">
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                                คาร์โบไฮเดรต: {meal.carbohydrate_amount} กรัม
                              </span>
                            </div>
                          )}

                          {meal.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">
                                {meal.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(meal)}
                            className="text-blue-600 hover:text-blue-800"
                            title="แก้ไข"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(meal.id)}
                            className="text-red-600 hover:text-red-800"
                            title="ลบ"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MealLog;
