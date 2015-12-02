'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("api", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            validate: {
                isInt: {
                    msg: 'please input integer value ID'
                }
            }
        },
        section_id: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'please input integer value ID'
                }
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: {
                    args: [1, 255],
                    msg: 'please input not too long title'
                },
                isEven: function (value) {
                    if (typeof value !== 'string' || value.match(/[+-,$%^*();\/|<>"'\\]/g)) {
                        throw new Error('Please input valid value title');
                    }
                }
            }
        },
        alias: {
            type: DataTypes.STRING(255),
            unique: true,
            validate: {
                len: {
                    args: [0, 255],
                    msg: 'please input not too long alias'
                },
                isValid: function (value) {
                    if (typeof value !== 'string') {
                        throw new Error('Please input valid value');
                    } else if (value === '') {
                        this.alias = this.title.replace(/[ ]/g, '-').toLowerCase();
                    }
                }
            }
        },
        markdown: DataTypes.TEXT,
        html: DataTypes.TEXT,
        published: {
            type: DataTypes.INTEGER,
            validate: {
                isIn: {
                    args: [['0', '1']],
                    msg: 'Please only input 0 and 1 values published'
                }
            }
        },
        ordering: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'please input integer value'
                }
            }
        },
        created_at: {
            type: DataTypes.DATE,
            validate: {
                isDate: {
                    msg: 'Please input datetime value'
                }
            }
        },
        created_by: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'please input integer value'
                }
            },
            allowNull: false
        },
        modified_at: {
            type: DataTypes.DATE,
            validate: {
                isDate: {
                    msg: 'Please input datetime value'
                }
            }
        },
        modified_by: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'Please input integer value'
                }
            }
        }
    }, {
        tableName: 'api',
        createdAt: 'created_at',
        updatedAt: 'modified_at'
    });

};