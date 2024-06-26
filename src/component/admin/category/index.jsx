import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import { Transition, Dialog } from "@headlessui/react";
import EditCate from "./edit-module";
import DeleteModuleC from "./delete-module";
import CreateCategoryForm from "./add-module";
import Loader from "../../loader";
import Pagination from "../../pagination";
import Topbar from "../../../app/admin/admin-dashboard/topbar";
import { useAuth } from "../../../contexts/AuthContext";

const Category = () => {
  const [getAllCate, setGetAllCate] = useState([]);
  const [cateEdit, setCateEdit] = useState("");
  const [isLoader, setLoader] = useState(false);
  const [editData, setEditData] = useState([]);
  const [categoryID, setCategoryID] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerOpenO, setIsDrawerOpenO] = useState(false);
  const [isOpenDelete, setOpenDelete] = useState(false);
  const [isRefresh, setRefresh] = useState(false);
  const [current_page, setCurrentPage] = useState(1);
  const [total_pages, setTotalPages] = useState(1);
  const limit = 50;
  const { adminAuthToken } = useAuth();

  const openDrawerO = async (_id) => {
    setLoader(true);
    setCateEdit(_id);
    try {
      const options = {
        method: "POST",
        url: "/api/category/getCategory",
        data: {
          id: _id,
        },
      };
      const response = await axios.request(options);
      if (response.status === 200) {
        setEditData(response?.data);
        setIsDrawerOpenO(true);
        setLoader(false);
      } else {
        console.error("Error: Unexpected response status");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const closeDrawerO = () => {
    setIsDrawerOpenO(false);
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  function closeModal() {
    setOpenDelete(false);
  }

  function openModal(id) {
    setCategoryID(id);
    setOpenDelete(true);
  }
  const refreshData = () => {
    setRefresh(!isRefresh);
  };

  useEffect(() => {
    defaultCategory(current_page, limit);
  }, [current_page, isRefresh]);

  const defaultCategory = (page, limit) => {
    setLoader(true);

    const option = {
      method: "GET",
      url: "/api/category/getallCategory",
      params: {
        page: page,
        limit: limit,
      },
      headers: {
        authorization: adminAuthToken,
      },
    };
    axios
      .request(option)
      .then((response) => {
        setGetAllCate(response.data.categories);
        setTotalPages(response?.data?.total_pages || 1);
        setLoader(false);
      })
      .catch((error) => {
        console.log("Error", error);
      });
  };

  const handleSearch = (e) => {
    const search = e.target.value;
    setCurrentPage(1);
    if (search.trim() === "") {
      refreshData();
    } else {
      const options = {
        method: "GET",
        url: `/api/category/getallCategory?searchQuery=${search}&limit=${limit}&page=${1}`,
        headers: {
          authorization: adminAuthToken,
        },
      };
      axios
        .request(options)
        .then(function (response) {
          if (response.status === 200) {
            setGetAllCate(response?.data?.categories);
            setTotalPages(response?.data?.total_pages || 1);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <>
      {isLoader && <Loader />}
      <ToastContainer autoClose={3000} />
      <Topbar />
      <div className="h-screen 2xl:pb-16 xl:pb-12 lg:pb-10">
        <div className="sm:mt-2 lg:mt-3 xl:mt-4 2xl:mt-7 border flex md:flex-row gap-y-3 py-4  flex-col justify-between items-center 2xl:pt-4 2xl:px-10 mt-2 sm:ml-10 mx-4 sm:mr-4 lg:mx-8 rounded-lg bg-white 2xl:h-[80px] xl:h-[70px] lg:h-[60px]  h-auto xl:px-8 lg:px-5 md:px-4 sm:px-4 px-4 2xl:text-2xl xl:text-[18px] lg:text-[16px] md:text-[15px] sm:text-[14px] text-[13px]">
          <h2 className="font-semibold whitespace-nowrap custom_heading_text">
            Category List{" "}
          </h2>

          <div className="items-center w-[50%] sm:w-[40%]  sm:my-0">
            <input
              type="search"
              className=" border border-gray-500 py-[2px] lg:py-[4px] 2xl:py-3 rounded-md lg:rounded-lg  w-full lg:max-w-auto max-w-[320px] 2xl:max-w-[440px] mx-auto md:w-12/12 focus:outline-none md:px-[15px] px-2 text-[15px] placeholder:text-[13px] custom_table_text"
              placeholder="Search"
              aria-label="Search"
              aria-describedby="button-addon1"
              onChange={handleSearch}
            />
          </div>
          <div className="">
            <button
              onClick={openDrawer}
              className="border hover:bg-gray-300 rounded-md my-auto bg-lightBlue-600  cursor-pointer 2xl:p-2  2xl:text-[18px] xl:p-2 xl:text-[14px] lg:p-[6px] lg:text-[12px] md:text-[10px] md:p-1 sm:text-[10px] sm:p-1 p-[3px] text-[12px]"
            >
              + Add Category
            </button>
          </div>
        </div>
        <div className="sm:ml-10 mx-4 sm:mr-4 lg:mx-8  overflow-y-scroll">
          <table className="w-full border bg-white rounded-md mt-5 p-100">
            <thead className="sticky-header">
              <tr
                className="bg-coolGray-200 text-gray-400 text-start flex border 
                custom_table_text"
              >
                <th className="mx-5 w-[30px] sm:w-2/12 text-start my-auto py-2 sm:py-2 md:py-2 lg:py-3 xl:py-4 2xl:py-5   ">
                  S.NO
                </th>
                <th className="xl:ml-10 w-6/12 sm:w-4/12 text-start my-auto py-2 sm:py-2 md:py-2 lg:py-3 xl:py-4 2xl:py-5  ">
                  CATEGORY NAME
                </th>

                <th className="text-start my-auto py-2 sm:py-2 md:py-2 lg:py-3 xl:py-4 2xl:py-5 w-3/12 ">
                  ACTION
                </th>
              </tr>
            </thead>
            {Array.isArray(getAllCate) && getAllCate?.length > 0 && (
              <tbody>
                {getAllCate?.map((item, index) => (
                  <tr
                    key={index}
                    className="text-start flex w-full custom_table_text"
                  >
                    <td className="mx-5 my-auto w-[30px] sm:w-2/12">
                      {index + 1 + 50 * (current_page - 1)}
                    </td>
                    <td className="my-auto xl:ml-10 w-6/12 sm:w-4/12 capitalize custom_table_text">
                      {item?.title}
                    </td>

                    <td className="w-3/12">
                      <div className="flex my-3 gap-3">
                        <button onClick={() => openDrawerO(item?._id)}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 text-sky-600"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(item?._id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 text-red-800"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}

            {Array.isArray(getAllCate) && getAllCate?.length === 0 && (
              <div className="py-6 px-4 border-t ">
                <p className="text-[14px]  2xl:text-[20px] font-medium text-center">
                  {" "}
                  No Data Found{" "}
                </p>
              </div>
            )}
          </table>
        </div>
        {total_pages > 1 && (
          <Pagination
            total_pages={total_pages}
            current_page={current_page}
            onPageChange={handlePageChange}
          />
        )}
      </div>
      {/* -----------Add category Popup---------- */}

      <Transition appear show={isDrawerOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-1 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-2/3 sm:w-full sm:max-w-[500px] transform overflow-hidden rounded-2xl bg-white sm:py-6 p-4  sm:px-8 lg:px-8 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-end">
                    <button onClick={closeDrawer}>
                      <img
                        className="w-7 md:w-7 lg:w-8 xl:w-9 2xl:w-14"
                        src={"/images/close-square.svg"}
                      />
                    </button>
                  </div>
                  <CreateCategoryForm
                    closeDrawer={closeDrawer}
                    refreshData={refreshData}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ------------Edit popup--------- */}
      <Transition appear show={isDrawerOpenO} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-2/3 sm:w-full sm:max-w-[500px]  transform overflow-hidden rounded-2xl bg-white p-4  sm:px-8 lg:px-8 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-end">
                    <button onClick={closeDrawerO}>
                      <img
                        className="w-7"
                        src={"/images/close-square.svg"}
                        alt="close-img"
                      />
                    </button>
                  </div>
                  <EditCate
                    cateEdit={cateEdit}
                    closeDrawer={closeDrawerO}
                    refreshData={refreshData}
                    editData={editData}
                  />
                  {/* <DeleteModuleC
                    categoryID={categoryID}
                    closeModal={closeModal}
                    refreshData={refreshData}
                  /> */}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isOpenDelete} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-[90%] sm:w-full sm:max-w-[500px] transform overflow-hidden rounded-2xl bg-white p-4  sm:px-8 lg:px-8 2xl:p-10 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="custom_heading_text font-semibold leading-6 text-gray-900 mt lg:mt-5"
                  >
                    Are You Sure! Want to Delete?
                  </Dialog.Title>
                  <DeleteModuleC
                    categoryID={categoryID}
                    closeModal={closeModal}
                    refreshData={refreshData}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Category;
