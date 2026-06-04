import { DataService } from "../../services/DataService";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FileText, Download, Eye, Upload, Trash2, X, File, Search } from "lucide-react";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
import { toast } from "sonner";

interface Document {
  id: string;
  employeeId: string;
  type: string;
  filename: string;
  uploadedOn: string;
  uploadedBy: string;
  size: string;
  verified: boolean;
}

export function DocumentManagement() {
  const [employees, setEmployees] = useState<EmployeeDatabaseRecord[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", employeeId: "EMP001", type: "ID Proof", filename: "aadhaar_scan.pdf", uploadedOn: "2024-03-05", uploadedBy: "Rahul Verma", size: "2.3 MB", verified: true },
    { id: "2", employeeId: "EMP001", type: "Address Proof", filename: "utility_bill.pdf", uploadedOn: "2024-03-06", uploadedBy: "Rahul Verma", size: "1.1 MB", verified: true },
    { id: "3", employeeId: "EMP001", type: "PAN Card", filename: "pan_card.pdf", uploadedOn: "2024-03-05", uploadedBy: "Rahul Verma", size: "0.8 MB", verified: true },
    { id: "4", employeeId: "EMP002", type: "Educational Certificate", filename: "degree.pdf", uploadedOn: "2024-03-08", uploadedBy: "Priya Sharma", size: "3.5 MB", verified: false },
    { id: "5", employeeId: "EMP001", type: "Offer Letter", filename: "offer_letter.pdf", uploadedOn: "2024-02-20", uploadedBy: "HR Department", size: "0.5 MB", verified: true },
    { id: "6", employeeId: "EMP001", type: "Appointment Letter", filename: "appointment.pdf", uploadedOn: "2024-03-01", uploadedBy: "HR Department", size: "0.6 MB", verified: true },
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");

  useEffect(() => {
    const loadEmployees = () => {
      const allEmployees = employeeDatabaseService.getAll();
      setEmployees(allEmployees);
    };

    loadEmployees();

    const unsubscribe = employeeDatabaseService.subscribe(() => {
      loadEmployees();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowEmployeeDropdown(false);
    };

    if (showEmployeeDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showEmployeeDropdown]);

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.id.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  const filteredDocuments = selectedEmployeeId
    ? documents.filter(doc => doc.employeeId === selectedEmployeeId)
    : [];

  const handleUploadDocument = () => {
    if (uploadFile && documentType && selectedEmployeeId) {
      const newDoc: Document = {
        id: String(documents.length + 1),
        employeeId: selectedEmployeeId,
        type: documentType,
        filename: uploadFile.name,
        uploadedOn: new Date().toISOString().split("T")[0],
        uploadedBy: "Current User",
        size: `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`,
        verified: false,
      };
      setDocuments([...documents, newDoc]);
      setShowUploadModal(false);
      setUploadFile(null);
      setDocumentType("");
      toast.success(`Document uploaded — ${uploadFile.name} is pending verification`);
    }
  };

  const handleDelete = (doc: Document) => {
    if (confirm(`Are you sure you want to delete ${doc.filename}?`)) {
      setDocuments(documents.filter(d => d.id !== doc.id));
      toast.success(`✅ Document Deleted!\n\n${doc.filename} has been removed.`);
    }
  };

  const handleVerify = (doc: Document) => {
    const updated = documents.map(d =>
      d.id === doc.id ? { ...d, verified: true } : d
    );
    setDocuments(updated);
    toast.success(`✅ Document Verified!\n\n${doc.filename} has been marked as verified.`);
  };

  return (
    <div className="space-y-6">
      {/* Employee Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Viewing documents for:
            </Label>
            <div className="relative flex-1 max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Select employee"
                  value={selectedEmployee ? `${selectedEmployee.fullName} (${selectedEmployee.id})` : employeeSearchTerm}
                  onChange={(e) => {
                    setEmployeeSearchTerm(e.target.value);
                    setShowEmployeeDropdown(true);
                    if (selectedEmployeeId) setSelectedEmployeeId("");
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  className="pl-9"
                />
              </div>
              {showEmployeeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedEmployeeId(emp.id);
                          setEmployeeSearchTerm("");
                          setShowEmployeeDropdown(false);
                        }}
                      >
                        <div className="font-medium text-gray-900">{emp.fullName}</div>
                        <div className="text-sm text-gray-500">{emp.id} • {emp.designation}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No employees found</div>
                  )}
                </div>
              )}
            </div>
            {selectedEmployeeId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEmployeeId("");
                  setEmployeeSearchTerm("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedEmployeeId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredDocuments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Verified</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredDocuments.filter(d => d.verified).length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Pending Verification</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredDocuments.filter(d => !d.verified).length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedEmployee
                ? `Documents — ${selectedEmployee.fullName}`
                : "Employee Document Repository"
              }
            </CardTitle>
            <Button
              onClick={() => setShowUploadModal(true)}
              disabled={!selectedEmployeeId}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedEmployeeId ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No Employee Selected</h3>
              <p className="text-sm text-gray-600">
                Select an employee above to view or manage their documents
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Document Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Filename</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Uploaded On</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Badge variant="outline">{doc.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.size}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.uploadedBy}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.uploadedOn}</td>
                      <td className="px-4 py-3 text-center">
                        {doc.verified ? (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowPreviewModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info(`Downloading ${doc.filename}...`)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          {!doc.verified && (
                            <Button
                              size="sm"
                              onClick={() => handleVerify(doc)}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Upload Document</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div>
                  <Label>Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID Proof">ID Proof (Aadhaar)</SelectItem>
                      <SelectItem value="Address Proof">Address Proof</SelectItem>
                      <SelectItem value="PAN Card">PAN Card</SelectItem>
                      <SelectItem value="Educational Certificate">Educational Certificate</SelectItem>
                      <SelectItem value="Experience Letter">Experience Letter</SelectItem>
                      <SelectItem value="Medical Certificate">Medical Certificate</SelectItem>
                      <SelectItem value="Police Verification">Police Verification</SelectItem>
                      <SelectItem value="Bank Details">Bank Details</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Upload File *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, JPG, PNG (Max 10MB)
                  </p>
                </div>

                {uploadFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Selected: {uploadFile.name}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Size: {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1" 
                    onClick={handleUploadDocument}
                    disabled={!uploadFile || !documentType}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Document Preview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-gray-500">Document Type</Label>
                    <p className="font-medium text-gray-900 mt-1">{selectedDoc.type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Filename</Label>
                    <p className="font-medium text-gray-900 mt-1">{selectedDoc.filename}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Size</Label>
                    <p className="font-medium text-gray-900 mt-1">{selectedDoc.size}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Uploaded On</Label>
                    <p className="font-medium text-gray-900 mt-1">{selectedDoc.uploadedOn}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Uploaded By</Label>
                    <p className="font-medium text-gray-900 mt-1">{selectedDoc.uploadedBy}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <Badge className={`mt-1 ${selectedDoc.verified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {selectedDoc.verified ? 'Verified' : 'Pending Verification'}
                    </Badge>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Document preview not available</p>
                  <p className="text-sm text-gray-500 mt-1">Click download to view the file</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => toast.info(`Downloading ${selectedDoc.filename}...`)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {!selectedDoc.verified && (
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        handleVerify(selectedDoc);
                        setShowPreviewModal(false);
                      }}
                    >
                      Mark as Verified
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
