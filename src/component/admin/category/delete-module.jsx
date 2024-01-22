import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext";

const DeleteModuleC = ({ categoryID, closeModal, refreshData }) => {
  const [isLoading, setLoading] = useState(false);
  const { adminAuthToken } = useAuth();

  const handleClose = () => {
    closeModal();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.delete("/api/category/deleteCategory", {
        data: { id: categoryID },
        headers: {
          Accept: "application/json",
          authorization: adminAuthToken,
        },
      });

      if (response.status === 200) {
        toast.success("Category Deleted successfully!");
        handleClose();
        refreshData();
      } else {
        toast.error("Failed. Something went wrong!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed. Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-2">
        <p className="text-[12px] sm:text-[16px] font-normal ms:leading-[30px] text-gray-500 mt-4">
          Do you really want to delete these records? You can't view this in
          your list anymore if you delete!
        </p>
      </div>

      <div className="mt-8">
        <div className="flex  justify-between gap-x-2 sm:gap-x-5">
          <button
            className="w-full border border-sky-400 text-sky-700 rounded-md text-[12px] sm:text-[16px] px-2 py-2 sm:py-3
                        hover:bg-lightBlue-200 hover:bg-sky-200"
            onClick={handleClose}
          >
            No, Keep It
          </button>

          <button
            className={`w-full border bg-red-200  border-red-400 text-red-500 rounded-md text-[12px] sm:text-[16px] px-2  sm:py-3
                        ${isLoading ? 'bg-gray-200' : 'hover:bg-red-200'}
                        hover:border-none`}
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Yes, Delete It"}
          </button>
        </div>
      </div>
    </>
  );
};

export default DeleteModuleC;
